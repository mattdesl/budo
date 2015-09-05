var bole = require('bole')
var log = bole('budo')
var xtend = require('xtend')
var once = require('once')
var EventEmitter = require('events').EventEmitter

var getPorts = require('./get-ports')
var createServer = require('./create-server')
var createBundler = require('./create-bundler')
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
  var watcher

  if (entries.length === 0) {
    return bail('no entry files specified!')
  }

  watcher = createBundler(entryFiles, opts)
  watcher.on('log', function (ev) {
    if (ev.type === 'bundle') {
      ev.url = '/' + opts.serve
      ev.elapsed = ev.elapsed + 'ms'
    }
    log.info(ev)
  })

  watcher.on('update', function (contents, deps) {
    emitter.emit('update', contents, deps)
  })

  var server = createServer(watcher.middleware, opts)
  var closed = false
  var running = false

  // public API
  emitter.close = once(close)

  // start portfinding + connect
  getPorts(opts, handlePorts)

  return emitter

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
    running = true

    var port = opts.port
    var uri = 'http://' + hostname + ':' + port + '/'

    log.info({ message: 'Server running at', url: uri, type: 'connect' })

    // provide info on server connection
    emitter.emit('connect', {
      uri: uri,
      port: port,
      host: hostname,
      serve: opts.serve,
      entries: entries,
      static: opts.static,
      dir: opts.dir
    })
  }

  function close () {
    closed = true
    if (running) server.close()
  }

  function bail (msg) {
    process.nextTick(function () {
      emitter.emit('error', new Error(msg))
    })
    return emitter
  }
}
