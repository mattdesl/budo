var ecstatic = require('ecstatic')
var Router = require('routes-router')
var http = require('http')
var fs = require('fs')
var path = require('path')
var log = require('bole')('budo')
var fs = require('fs')
var inject = require('inject-lr-script')
var Emitter = require('events/')
var url = require('url')
var defaultIndex = require('./default-index')

module.exports = function(opts) {
  var handler = createHandler(opts)
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

function createHandler(opts) {
  var basedir = opts.dir || process.cwd()
  var staticHandler = ecstatic(basedir)
  var router = Router()
      
  var defaulLiveOpts = { 
    host: opts.host, 
    port: opts.livePort || opts['live-port'] 
  }

  var emitter = new Emitter()
  emitter.live = opts.live ? defaulLiveOpts : null
  emitter.router = router
  emitter.pending = false
  emitter.contents = ''

  router.addRoute('/' + url.parse(opts.serve).pathname, function(req, res) {
    log.info({
      url: req.url,
      type: 'static'
    })  
    
    if (emitter.pending) {
      log.debug("bundle pending")
      emitter.once('update', function() {
        log.debug("bundle ready")
        submit(req, res)
      })
    } else {
      submit(req, res)
    }
  })

  router.addRoute('/index.html', home)
  router.addRoute('/', home)
  router.addRoute('*.html', wildcard(true))
  router.addRoute('*', wildcard())

  return emitter

  function pushstate(req, res) {
    staticHandler(req, res, function () {
      if (opts.pushstate) {
        // reset for home
        req.url = '/'
        res.statusCode = 200
        home(req, res)
      } else {
        res.end()
      }
    })
  }

  function wildcard(html) {
    return function(req, res) {
      //inject LiveReload into HTML content if needed
      if (html && emitter.live)
        res = inject(res, emitter.live)
      log.info({
        url: req.url,
        type: 'static'
      })
      pushstate(req, res)
    }
  }

  function submit(req, res) {
    res.setHeader('content-type', 'text/javascript')
    res.setHeader('content-length', emitter.contents.length);
    res.statusCode = req.statusCode || 200
    
    res.end(emitter.contents)
  }

  function home(req, res) {
    fs.exists(path.join(basedir, 'index.html'), function(exists) {
      //inject LiveReload into HTML content if needed
      if (emitter.live)
        res = inject(res, emitter.live)

      var type = exists ? 'static' : 'generated'
      log.info({
        url: req.url,
        type: type
      })

      if (exists)
        staticHandler(req, res)
      else
        generateIndex(opts.serve, req, res)
    })
  }

  function generateIndex(outfile, req, res) {
    res.setHeader('content-type', 'text/html')

    var stream = opts.defaultIndex || defaultIndex
    stream({
      entry: outfile
    }).pipe(res)
  }
}