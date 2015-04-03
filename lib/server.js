var ecstatic = require('ecstatic')
var Router = require('routes-router')
var http = require('http')
var fs = require('fs')
var path = require('path')
var log = require('bole')('budo')
var fs = require('fs')
var html = require('./default-index')
var inject = require('inject-lr-script')
var Emitter = require('events/')

module.exports.http = function(opts) {
  var handler = module.exports.static(opts)
  var server = http.createServer(handler.router)

  Object.defineProperty(server, '_live', {
    get: function() {
      return handler.live
    },
    set: function(live) {
      handler.live = live
    }
  })

  server.update = function() {
    handler.pending = false
    handler.emit('update')
  }

  server.pending = function() {
    handler.pending = true
  }

  return server
}

module.exports.static = function(opts) {
  var basedir = opts.dir || process.cwd()
  var staticHandler = ecstatic(basedir)
  var router = Router()
      
  var emitter = new Emitter()
  var pendingTimeout
  emitter.live = opts.live
  emitter.router = router
  emitter.pending = false

  var liveOpts = {
    host: opts.host,
    port: opts['live-port']
  }

  var out = opts.output
  var entryHandler = staticHandler
  if (out.tmp) {
    entryHandler = ecstatic({
      root: out.dir
    })
  }

  router.addRoute('/' + out.to, function(req, res, params) {
    log.info({
      url: req.url,
      type: 'static'
    })
    
    if (emitter.pending) {
      console.log("Bundle pending...")
      var served = false
      var ready = function() {
        console.log("Late serve")
        served = true
        setTimeout(function() {
          entryHandler(req, res)
        }, 100)
      }
      emitter.removeAllListeners('update')
      emitter.once('update', ready)
      setTimeout(function() {
        if (served)
          return
        console.log("Reached timeout without being ready")
        emitter.removeListener('update', ready)
        res.writeHead(404)
        res.end('404')
      }, 2000)
    } else {
      console.log("Bundle ready...")
      entryHandler(req, res)
    }
  })

  router.addRoute('/index.html', home)
  router.addRoute('/', home)

  router.addRoute('*', function(req, res, params) {
    log.info({
      url: req.url,
      type: 'static'
    })
    staticHandler(req, res)
  })

  return emitter

  function attempt(req, res) {
    var tries = 3,
      interval = 50
    // fs.stat(out.from, function(err, stat) {
    //   if (err)
    //     console.error(err)
    //   else
    //     console.error(stat.size)

    // })
      // if (stat.size > 0)
    entryHandler(req, res)
  }

  function home(req, res, params) {
    fs.exists(path.join(basedir, 'index.html'), function(exists) {
      //inject LiveReload into HTML content if needed
      if (emitter.live)
        res = inject(res, liveOpts)
      var type = exists ? 'static' : 'generated'
      log.info({
        url: req.url,
        type: type
      })

      if (exists)
        staticHandler(req, res)
      else
        generateIndex(out.to, req, res)
    })
  }

  function generateIndex(outfile, req, res) {
    res.setHeader('content-type', 'text/html')
    html({
      outfile: outfile
    }).pipe(res)
  }
}