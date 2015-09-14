var bole = require('bole')
var xtend = require('xtend')
var once = require('once')
var path = require('path')
var EventEmitter = require('events').EventEmitter
var isMatch = require('micromatch').isMatch
var openUrl = require('opn')

var getPorts = require('./get-ports')
var createServer = require('./server')
var createBundler = require('./bundler')
var createFileWatch = require('./file-watch')
var createTinylr = require('./tinylr')
var mapEntry = require('./map-entry')

var noop = function () {}
var log = bole('budo')

module.exports = createBudo
function createBudo (entries, opts) {
  // if no entries are specified, just options
  if (entries && !Array.isArray(entries) && typeof entries === 'object') {
    opts = entries
    entries = []
  }

  // do not mutate user options
  opts = xtend({ portfind: true }, opts)
  entries = entries || []

  // perhaps later this will be configurable
  opts.cwd = process.cwd()

  // log to output stream
  if (opts.stream) {
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

  var hostname = (opts.host || 'localhost')
  var emitter = new EventEmitter()
  var bundler, middleware

  if (entries.length > 0) {
    bundler = createBundler(entryFiles, opts)
    middleware = bundler.middleware

    bundler.on('log', function (ev) {
      if (ev.type === 'bundle') {
        ev.url = '/' + opts.serve
        ev.name = 'browserify'
        var time = ev.elapsed
        ev.elapsed = time + 'ms'
        ev.colors = { elapsed: time > 1000 ? 'yellow' : 'dim' }
      }
      log.info(ev)
    })

    // uncaught syntax errors should not stop the server
    // this only happens when errorHandler: false
    bundler.on('error', function (err) {
      console.error('Error:', err.message ? err.message : err)
    })
    bundler.on('update', emitter.emit.bind(emitter, 'update'))
    bundler.on('pending', emitter.emit.bind(emitter, 'pending'))
  }

  var server = createServer(middleware, opts)
  var closed = false
  var started = false
  var fileWatcher = null
  var tinylr = null
  var deferredWatch = noop
  var deferredLive = noop

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

  // start portfinding + connect
  getPorts(opts, handlePorts)
  return emitter

  function defaultFileEvent (file) {
    var filename = path.basename(file)
    if (typeof opts.live === 'string' && !isMatch(filename, opts.live)) {
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
      glob = glob && glob.length > 0 ? glob : '**/*.{html,css}'
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

      liveOpts = xtend({
        host: opts.host,
        port: opts.livePort
      }, liveOpts)

      // inject script tag into HTML requests
      server.setLiveOptions(liveOpts)
      tinylr = createTinylr(liveOpts)
    }
    return emitter
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
    server.listen(opts.port, opts.host, connect)
  }

  function connect () {
    if (closed) return
    started = true

    var port = opts.port
    var uri = 'http://' + hostname + ':' + port + '/'

    log.info({ message: 'Server running at', url: uri, type: 'connect' })

    // if live() or watch() was called before connection
    deferredWatch()
    deferredLive()

    // provide info on server connection
    emitter.emit('connect', {
      uri: uri,
      port: port,
      livePort: opts.livePort,
      host: hostname,
      serve: opts.serve,
      entries: entryFiles,
      dir: opts.dir
    })

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

    if (started) server.close()
    if (tinylr) tinylr.close()
    if (bundler) bundler.close()
    if (fileWatcher) fileWatcher.close()
    closed = true
    started = false
  }
}
