var http = require('http')
var path = require('path')
var defaultIndex = require('simple-html-index')
var ecstatic = require('ecstatic')
var Router = require('routes-router')
var inject = require('inject-lr-script')
var fs = require('fs')
var log = require('bole')('budo')

module.exports = createServer
function createServer (entryHandler, opts) {
  var router = Router()
  var staticPaths = [].concat(opts.dir).filter(Boolean)
  if (staticPaths.length === 0) {
    staticPaths = [ process.cwd() ]
  }
  var basedir = staticPaths[0]

  var staticHandlers = staticPaths.map(function (filepath, i, list) {
    var last = i === list.length - 1
    return ecstatic({ root: filepath, handleError: last })
  })

  var live = opts.live
  var middleware = opts.middleware || defaultMiddleware
  if (typeof middleware !== 'function') {
    throw new TypeError('expected opts.middleware to be a function')
  }

  var server = http.createServer(function (req, res) {
    if (middleware.length === 3) {
      // user is handling next()
      middleware(req, res, function () {
        router(req, res)
      })
    } else {
      middleware(req, res)
      router(req, res)
    }
  })

  if (entryHandler) {
    router.addRoute('/' + opts.serve, function (req, res) {
      log.info({
        url: req.url,
        type: 'generated'
      })
      entryHandler(req, res)
    })
  }

  router.addRoute('/index.html', home)
  router.addRoute('/', home)
  router.addRoute('*.html', wildcard(true))
  router.addRoute('*', wildcard())

  // allow user to toggle live reload integration
  server.setLiveOptions = setLiveOptions
  return server

  function defaultMiddleware (req, res, next) {
    next()
  }

  function setLiveOptions (liveOpts) {
    live = liveOpts
  }

  function wildcard (html) {
    return function (req, res) {
      // inject LiveReload into HTML content if needed
      if (html && live) {
        res = inject(res, live)
      }
      log.info({
        url: req.url,
        type: 'static'
      })
      staticRequest(req, res)
    }
  }

  function staticRequest (req, res, stack) {
    if (!stack) {
      stack = staticHandlers.slice()
    }
    var nextFn = stack.shift()
    nextFn(req, res, function () {
      if (stack.length === 0) {
        if (opts.pushstate) {
          // reset for home
          req.url = '/'
          res.statusCode = 200
          home(req, res)
        } else {
          res.statusCode = 404
          res.end('404 not found: ' + req.url)
        }
      } else {
        staticRequest(req, res, stack)
      }
    })
  }

  function home (req, res) {
    fs.exists(path.join(basedir, 'index.html'), function (exists) {
      // inject LiveReload into HTML content if needed
      if (live) {
        res = inject(res, live)
      }

      var type = exists ? 'static' : 'generated'
      log.info({
        url: req.url,
        type: type
      })

      if (exists) {
        staticRequest(req, res)
      } else {
        generateIndex(opts.serve, req, res)
      }
    })
  }

  function generateIndex (outfile, req, res) {
    res.setHeader('content-type', 'text/html')

    var stream = opts.defaultIndex || defaultIndex
    stream({
      entry: outfile
    }).pipe(res)
  }
}
