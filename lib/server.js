var ecstatic = require('ecstatic')
var Router = require('routes-router')
var http = require('http')
var fs = require('fs')
var path = require('path')
var log = require('bole')('budo')
var fs = require('fs')
var html = require('./default-index')
var inject = require('inject-lr-script')

module.exports.http = function(opts) {
  var handler = module.exports.static(opts)
  var server = http.createServer(handler)

  Object.defineProperty(server, '_live', {
    get: function() {
      return handler._live
    },
    set: function(live) {
      handler._live = live
    }
  })

  return server
}

module.exports.static = function(opts) {
  var basedir = opts.dir || process.cwd()
  var staticHandler = ecstatic(basedir)
  var router = Router()

  router._live = opts.live
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
    entryHandler(req, res)
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

  return router

  function home(req, res, params) {
    fs.exists(path.join(basedir, 'index.html'), function(exists) {
      //inject LiveReload into HTML content if needed
      if (router._live)
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