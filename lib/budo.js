var path = require('path')
var Emitter = require('events/')
var watchify = require('./watchify')
var xtend = require('xtend')
var assign = require('xtend/mutable')
var http = require('./server').http
var log = require('bole')('budo')
var dargs = require('dargs')
var createFileWatch = require('./file-watch')
var createTinylr = require('./tinylr')

module.exports = function() {
  var emitter = new Emitter()
  var started = false
  var closed = false

  var watchifyProc
  var server
  var watcher
  var tinylr
  var defaultGlobs
  var defaultLiveOpts
  var defaultWatchOpts
  var deferreds = []

  emitter._start = function(entries, output, opt) {
    opt = opt || {}
    var port = opt.port
    var serverOpt = xtend(opt, {
      output: output
    })

    server = http(serverOpt)
      .on('error', function(err) {
        emitter.emit('error', err)
      })
      .listen(port, opt.host, function(err) {
        if (err) {
          emitter.emit('error', new Error("Could not connect to server: " + err))
          return
        }

        //setup "event" param for callback
        assignOptions(output, opt)

        //start watchify process
        runWatchify(entries, output, opt)
        
        started = true
        
        //if user wanted live() or watch() enabled
        deferreds.forEach(function(func) {
          func()
        })
        deferreds.length = 0

        //finally, emit callback
        emitter.emit('connect', emitter)
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
  emitter.live = function(liveOpt) {
    if (!started) {
      deferreds.push(emitter.live.bind(null, liveOpt))
    } else {
      liveOpt = liveOpt||{}
      server._live = !liveOpt.plugin
      tinylr = createTinylr(xtend(defaultLiveOpts, liveOpt))
      emitter.reload = function(path) {
        tinylr.reload(path)
        emitter.emit('reload', path)
      }
      emitter.live = noop
    }
    return emitter
  }

  //close everything
  emitter.close = function() {
    if (closed)
      return
    closed = true
    if (watchifyProc)
      watchifyProc.kill()
    if (watcher)
      watcher.close()
    if (tinylr)
      tinylr.close()
    if (server)
      server.close()
    emitter.live = noop
    emitter.watch = noop
    emitter.emit('exit')
  }

  return emitter

  function runWatchify(entries, output, opt) {    
    if (closed)
      return

    //setup watchify; when it ends, close the server
    var watchifyArgs = getWatchifyArgs(entries, output, opt)
    watchifyProc = watchify(watchifyArgs)
    watchifyProc.stderr.on('end', function() {
      emitter.close()
    })
  }

  function assignOptions(output, opt) {
    var hostname = (opt.host || 'localhost')
    var uri = "http://" + hostname + ":" + opt.port + "/"
    log.info("Server running at", uri)

    //bug with chokidar@1.0.0-rc3
    //anything in OSX tmp dirs need a wildcard
    //to work with fsevents
    var glob = output.tmp ? path.join(output.dir, '*.js') : output.from

    //add the uri / output to budo instance
    assign(emitter, {
      uri: uri,
      port: opt.port,
      host: hostname,
      server: server,
      'live-port': opt['live-port']
    }, output, {
      glob: glob
    })

    //defaults for live() / watch() functions
    defaultGlobs = ['**/*.{html,css}', emitter.glob]
    //watchify@3 has some extra options
    defaultWatchOpts = {
      poll: opt['poll'],
      'ignore-watch': typeof opt['ignore-watch'] === 'undefined' ? opt.iw : opt['ignore-watch']
    }
    defaultLiveOpts = {
      plugin: opt['live-plugin'],
      host: opt.host,
      port: emitter['live-port']
    }
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
  if (opt.ignoreWatch || typeof opt.ignoreWatch === 'string') {
    opt.ignored = opt.ignoreWatch
    delete opt.ignoreWatch
  } else {
    //otherwise let file-watch ignore some defaults
    delete opt.ignored
  }
}

function getWatchifyArgs(entries, output, opt) {
  //do not mutate original opts
  opt = assign({}, opt)

  //set output file
  opt.outfile = output.from
  delete opt.o

  //enable debug by default
  if (opt.d !== false && opt.debug !== false) {
    delete opt.d
    opt.debug = true
  }
  //if user explicitly disabled debug...
  else if (opt.d === false || opt.debug === false) {
    delete opt.d
    delete opt.debug
  }

  //clean up some possible collisions
  delete opt.dir
  delete opt.port
  delete opt.host
  delete opt.live
  delete opt['live-port']
  delete opt['live-script']
  delete opt['live-plugin']
  return entries.concat(dargs(opt))
}