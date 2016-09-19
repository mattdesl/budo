var bole = require('bole')
var xtend = require('xtend')
var once = require('once')
var path = require('path')
var EventEmitter = require('events').EventEmitter
var isMatch = require('micromatch')
var openUrl = require('opn')
var internalIp = require('internal-ip')
var garnish = require('garnish')

var defaults = require('./parse-args').defaults
var getPorts = require('./get-ports')
var createServer = require('./server')
var createBundler = require('./bundler')
var createFileWatch = require('./file-watch')
var createTinylr = require('./tinylr')
var mapEntry = require('./map-entry')

var noop = function () {}

module.exports = createBudo
function createBudo (entries, opts) {
  var log = bole('budo')

  // if no entries are specified, just options
  if (entries && !Array.isArray(entries) && typeof entries === 'object') {
    opts = entries
    entries = []
  }

  // do not mutate user options
  opts = xtend({}, defaults, { stream: false }, opts)
  entries = entries || []

  // perhaps later this will be configurable
  opts.cwd = process.cwd()

  // log to output stream
  if (opts.stream) {
    // by default, pretty-print to the stream with info logging
    if (!opts.ndjson) {
      var pretty = garnish({
        level: opts.verbose ? 'debug' : 'info',
        name: 'budo'
      })
      pretty.pipe(opts.stream)
      opts.stream = pretty
    }

    bole.output({
      stream: opts.stream,
      level: 'debug'
    })
  }

  // optionally allow as arrays
  entries = [].concat(entries).filter(Boolean)

  var entryObjects = entries.map(mapEntry)
  var entryFiles = entryObjects.map(function (entry) {
    return entry.from
  })

  if (opts.serve && typeof opts.serve !== 'string') {
    throw new TypeError('opts.serve must be a string or undefined')
  } else if (!opts.serve && entries.length > 0) {
    opts.serve = entryObjects[0].url
  }

  // default to cwd
  if (!opts.dir || opts.dir.length === 0) {
    opts.dir = opts.cwd
  }

  var emitter = new EventEmitter()
  var bundler, middleware

  if (entries.length > 0 || (opts.browserify && opts.browserify.entries)) {
    bundler = createBundler(entryFiles, opts)
    middleware = bundler.middleware

    bundler.on('log', function (ev) {
      if (ev.type === 'bundle') {
        var time = ev.elapsed
        ev.elapsed = time
        ev.name = 'browserify'
        ev.type = undefined
        ev.colors = {
          elapsed: time > 1000 ? 'yellow' : 'dim',
          message: 'dim '
        }
        log.info(ev)
      }
    })

    // uncaught syntax errors should not stop the server
    // this only happens when errorHandler: false
    bundler.on('error', function (err) {
      console.error('Error:', err.message ? err.message : err)
    })
    bundler.on('bundle-error', emitter.emit.bind(emitter, 'bundle-error'))
    bundler.on('update', emitter.emit.bind(emitter, 'update'))
    bundler.on('pending', emitter.emit.bind(emitter, 'pending'))

    emitter.on('update', function (contents, deps) {
      if (deps.length > 1) {
        log.debug({
          name: 'browserify',
          message: deps.length + ' files changed'
        })
      }
    })
  }

  var defaultWatchGlob = opts.watchGlob || '**/*.{html,css}'
  var server = null
  var closed = false
  var started = false
  var fileWatcher = null
  var tinylr = null
  var sslOpts = null // needed for livereload
  var deferredWatch = noop
  var deferredLive = noop

  // keep track of the original host
  // (can be undefined)
  var hostAddress = opts.host

  // public API
  emitter.close = once(close)
  emitter.reload = reload
  emitter.live = live
  emitter.watch = watch

  // setup defaults for live reload / watchify
  if (opts.live) {
    emitter
      .watch()
      .live()
      .on('watch', function (ev, file) {
        if (ev !== 'change' && ev !== 'add') {
          return
        }
        defaultFileEvent(file)
      })
      .on('pending', function () {
        defaultFileEvent(opts.serve)
      })
  }

  // First, setup a server
  createServer(middleware, opts, function (err, serverInstance, httpsCertKey) {
    if (err) {
      emitter.emit('error', err)
      return
    }

    server = serverInstance
    sslOpts = httpsCertKey

    // start portfinding + connect
    getPorts(opts, handlePorts)
  })

  return emitter

  function defaultFileEvent (file) {
    var filename = path.basename(file)
    if ((Array.isArray(opts.live) || typeof opts.live === 'string') &&
        isMatch(filename, opts.live).length === 0) {
      return
    }
    emitter.reload(file)
  }

  function reload (file) {
    process.nextTick(emitter.emit.bind(emitter, 'reload', file))
    if (tinylr) {
      tinylr.reload(file)
    }
  }

  // enable file watch capabilities
  function watch (glob, watchOpt) {
    if (!started) {
      deferredWatch = emitter.watch.bind(null, glob, watchOpt)
    } else {
      // destroy previous
      if (fileWatcher) fileWatcher.close()
      glob = glob && glob.length > 0 ? glob : defaultWatchGlob
      glob = Array.isArray(glob) ? glob : [ glob ]
      watchOpt = xtend({ poll: opts.poll }, watchOpt)

      fileWatcher = createFileWatch(glob, watchOpt)
      fileWatcher.on('watch', emitter.emit.bind(emitter, 'watch'))
    }
    return emitter
  }

  // enables LiveReload capabilities
  function live (liveOpts) {
    if (!started) {
      deferredLive = emitter.live.bind(null, liveOpts)
    } else {
      // destroy previous
      if (tinylr) tinylr.close()

      // default port
      liveOpts = xtend({ port: opts.livePort }, liveOpts)

      // default to budo host
      var hostName = liveOpts.host ? getHostAddress(liveOpts.host) : opts.host

      // the LiveReload <script> tag needs the actual host IP
      server.setLiveOptions(xtend({ host: hostName }, liveOpts))

      // the server should use :: or undefined for internal IP
      var tinylrOpts = xtend({ host: hostAddress }, sslOpts, liveOpts)
      tinylr = createTinylr(tinylrOpts)
    }
    return emitter
  }

  function getHostAddress (host) {
    // user can specify "::" or "0.0.0.0" as host exactly
    // or if undefined, default to internal-ip
    if (!host) {
      host = server.address().address
      if (host === '0.0.0.0') {
        // node 0.10 returns this when no host is specified
        // node 0.12 returns internal-ip
        host = '::'
      }
    }
    if (host === '::') {
      host = internalIp()
    }
    return host
  }

  function handlePorts (err, result) {
    if (closed) return
    if (err) {
      emitter.emit('error', err)
      return
    }

    opts.port = result.port
    opts.livePort = result.livePort

    // improve error messaging
    server.on('error', function (err) {
      if (err.code === 'EADDRINUSE') {
        err.message = 'port ' + opts.port + ' is in use'
        emitter.emit('error', err)
      } else {
        emitter.emit('error', err)
      }
    })

    // start server
    // no host -> use localhost + internal-ip
    server.listen(opts.port, opts.host || undefined, connect)
  }

  function connect () {
    if (closed) return
    started = true

    // default host is internal IP
    opts.host = getHostAddress(opts.host)

    var port = opts.port
    var protocol = opts.ssl ? 'https' : 'http'
    var uri = protocol + '://' + opts.host + ':' + port + '/'

    log.info({ message: 'Server running at', url: uri, type: 'connect' })

    // if live() or watch() was called before connection
    deferredWatch()
    deferredLive()

    // provide info on server connection
    emitter.emit('connect', {
      uri: uri,
      port: port,
      livePort: opts.livePort,
      host: opts.host,
      serve: opts.serve,
      entries: entryFiles,
      server: server,
      dir: opts.dir
    })

    // initial bundle should come after
    // connect event!
    if (bundler) bundler.bundle()

    // launch browser
    if (opts.open) {
      openUrl(uri)
    }
  }

  function close () {
    var next = emitter.emit.bind(emitter, 'exit')
    if (started) {
      server.once('close', next)
    } else {
      process.nextTick(next)
    }

    if (started) bole.reset()
    if (started) server.close()
    if (tinylr) tinylr.close()
    if (bundler) bundler.close()
    if (fileWatcher) fileWatcher.close()
    closed = true
    started = false
  }
}
