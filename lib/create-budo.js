var bole = require('bole')
var log = bole('budo')
var xtend = require('xtend')
var once = require('once')
var path = require('path')
var EventEmitter = require('events').EventEmitter
var noop = function () {}

var getPorts = require('./get-ports')
var createServer = require('./create-server')
var createBundler = require('./create-bundler')
var createFileWatch = require('./file-watch')
var createTinylr = require('./tinylr')

var mapEntry = require('./map-entry')

module.exports = createBudo
function createBudo (entries, opts) {
  // if no entries are specified
  if (entries && !Array.isArray(entries) && typeof entries === 'object') {
    opts = entries
    entries = []
  }

  // do not mutate user options
  opts = xtend({ portfind: true }, opts)

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
  var bundler

  if (entries.length === 0) {
    return bail('no entry files specified!')
  }

  bundler = createBundler(entryFiles, opts)
  bundler.on('log', function (ev) {
    if (ev.type === 'bundle') {
      ev.url = '/' + opts.serve
      ev.elapsed = ev.elapsed + 'ms'
    }
    log.info(ev)
  })

  bundler.on('update', emitter.emit.bind(emitter, 'update'))
  bundler.on('pending', emitter.emit.bind(emitter, 'pending'))

  var server = createServer(bundler.middleware, opts)
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
    emitter.live()
      .on('watch', function (ev, file) {
        var valid = ev === 'change' || ev === 'add'
        if (opts.hardReload !== false) {
          valid = /\.css$/i.test(file) && valid
        }
        if (valid) {
          emitter.reload(file)
        }
      })
      .on('pending', function () {
        if (opts.hardReload !== false) {
          emitter.reload(opts.serve)
        }
      })
  }
  if (opts.watch || opts.live) {
    var globArray = [].concat(opts.watch).filter(Boolean)
    var globs = opts.watch === true ? undefined : globArray
    emitter.watch(globs)
  }

  // start portfinding + connect
  getPorts(opts, handlePorts)

  return emitter

  function reload (file) {
    if (!tinylr) return
    tinylr.reload(file)
    emitter.emit('reload', file)
  }

  // enable file watch capabilities
  function watch (glob, watchOpt) {
    if (!started) {
      deferredWatch = emitter.watch.bind(null, glob, watchOpt)
    } else {
      // destroy previous
      if (fileWatcher) fileWatcher.close()
      glob = glob && glob.length > 0 ? glob : [ '**/*.{html,css}' ]
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

    // only override if we actually needed to find livePort
    if (typeof result.livePort !== 'undefined') {
      opts.livePort = result.livePort
    }

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
      entries: entries,
      static: opts.static,
      dir: opts.dir
    })
  }

  function close () {
    closed = true
    if (started) server.close()
    if (tinylr) tinylr.close()
    if (bundler) bundler.close()
    if (fileWatcher) fileWatcher.close()
  }

  function bail (msg) {
    process.nextTick(function () {
      emitter.emit('error', new Error(msg))
    })
    return emitter
  }
}
