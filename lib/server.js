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
var noop = function(){}

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

  server.update = function(contents) {
    handler.pending = false
    handler.contents = contents
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
  emitter.live = opts.live
  emitter.router = router
  emitter.pending = false
  emitter.contents = ''

  var previous = noop

  var liveOpts = {
    host: opts.host,
    port: opts['live-port']
  }

  var entryHandler = staticHandler

  router.addRoute('/' + opts.to, function(req, res, params) {
    log.info({
      url: req.url,
      type: 'static'
    })  
    
    if (emitter.pending) {
      console.log("Bundle pending...")
      emitter.once('update', function() {
        console.log("Bundle updated...")
        submit(req, res)
      })
    } else {
      console.log("Bundle ready...")
      submit(req, res)
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

  function submit(req, res) {
    res.setHeader('content-type', 'text/javascript')
    res.end(emitter.contents)
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
        generateIndex(opts.to, req, res)
    })
  }

  function generateIndex(outfile, req, res) {
    res.setHeader('content-type', 'text/html')
    html({
      outfile: outfile
    }).pipe(res)
  }
}