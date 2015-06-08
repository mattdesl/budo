var Emitter = require('events/')
var xtend = require('xtend')
var assign = require('xtend/mutable')
var log = require('bole')('budo')

var createServer = require('./server')
var createFileWatch = require('./file-watch')
var createTinylr = require('./tinylr')
var createWatchify = require('./watchify')

var DEFAULT_DELAY = 0

module.exports = function() {
  var emitter = new Emitter()
  var started = false
  var closed = false
  var serveAs
  
  var watchify
  var server
  var watcher
  var tinylr
  var defaultGlobs
  var defaultLiveOpts
  var defaultWatchOpts
  var deferreds = []

  emitter._start = function(entries, opt, cli) {
    opt = opt || {}
    var port = opt.port
    server = createServer(opt)
      .on('error', function(err) {
        emitter.emit('error', err)
      })
      .listen(port, opt.host, function() {
        var hostname = (opt.host || 'localhost')
        var uri = "http://" + hostname + ":" + opt.port + "/"

        log.info({ message: "Server running at " + uri, type: 'connect', url: uri })

        //defaults for watch() function
        defaultGlobs = ['**/*.{html,css}']

        //watchify@3 has some extra options
        var ignoreWatchArg = typeof opt['ignore-watch'] === 'undefined' 
              ? opt.iw 
              : opt['ignore-watch']
        defaultWatchOpts = {
          poll: opt.poll,
          'ignore-watch': opt.ignoreWatch || ignoreWatchArg
        }
        //and default live options
        defaultLiveOpts = {
          plugin: opt.livePlugin || opt['live-plugin'],
          host: opt.host,
          port: opt.livePort || opt['live-port']
        }

        //start watchify process
        runWatchify(entries, opt, cli)

        serveAs = opt.serve
        started = true
        
        //if user wanted live() or watch() enabled
        deferreds.forEach(function(func) {
          func()
        })
        deferreds.length = 0

        //finally, emit callback with some info
        emitter.emit('connect', {
          uri: uri,
          port: opt.port,
          host: hostname,
          serve: opt.serve,
          entries: entries,
          dir: opt.dir
        })
      })
    return emitter
  }
  
  //no-op until live() is enabled
  emitter.reload = noop

  //enable file watch capabilities
  emitter.watch = function(glob, watchOpt) {
    if (!started) {
      deferreds.push(emitter.watch.bind(null, glob, watchOpt))
    }
    else {
      watchOpt = xtend(defaultWatchOpts, watchOpt)
      watchOpt = getChokidarOpts(watchOpt) //transform to chokidar
      watcher = createFileWatch(glob || defaultGlobs, watchOpt)
      watcher.on('watch', emitter.emit.bind(emitter, 'watch'))
      emitter.watch = noop
    }
    return emitter
  }

  //enable live-reload capabilities
  emitter.live = function(liveOpts) {
    if (!started) {
      deferreds.push(emitter.live.bind(null, liveOpts))
    } else {
      liveOpts = xtend(defaultLiveOpts, liveOpts)
      
      //if plugin, ignore live reload in HTML, 
      //otherwise inject with new options (host/port)
      server._live = liveOpts.plugin ? null : liveOpts
      
      tinylr = createTinylr(liveOpts)
      emitter.reload = function(file) {
        tinylr.reload(file)
        emitter.emit('reload', file)
      }
      emitter.live = noop
    }
    return emitter
  }

  //close everything
  emitter.close = function() {
    if (closed)
      return emitter
    closed = true
    if (watchify)
      watchify.close()
    if (watcher)
      watcher.close()
    if (tinylr)
      tinylr.close()
    if (server)
      server.close()
    emitter.live = noop
    emitter.watch = noop
    emitter.emit('exit')
    return emitter
  }

  return emitter

  function runWatchify(entries, opt, cli) {    
    if (closed)
      return

    //create a new watchify instance
    watchify = createWatchify(entries, opt, { 
      cli: cli, //whether to use watchify/bin/args or not
      dir: opt.dir,
      serve: opt.serve,
      verbose: opt.v || opt.verbose,
      delay: typeof opt.delay === 'number' ? opt.delay : DEFAULT_DELAY
    })
    .on('update', function(contents) {
      if (server) 
        server.update(contents)
      emitter.emit('update', serveAs, contents)
    })
    .on('pending', function() {
      if (server) 
        server.pending()
      emitter.emit('pending', serveAs)
    })
    .on('error', emitter.emit.bind(emitter, 'error'))
  }

  function noop() {
    return emitter
  }
}

function getChokidarOpts(opt) {
  //do not mutate original opts
  opt = assign({}, opt)

  if (opt.poll || opt.poll === 0) {
    var interval = opt.poll
    opt.usePolling = true
    opt.interval = typeof interval === 'number' ? interval : 100
    delete opt.poll
  }
  if (opt['ignore-watch'] || typeof opt['ignore-watch'] === 'string') {
    opt.ignored = opt['ignore-watch']
    delete opt['ignore-watch']
  } else {
    //otherwise let file-watch ignore some defaults
    delete opt.ignored
  }
  return opt
}
