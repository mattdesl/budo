var http = require('http')
var path = require('path')
var defaultIndex = require('simple-html-index')
var ecstatic = require('ecstatic')
var Router = require('routes-router')
var inject = require('inject-lr-script')
var urlParse = require('url').parse
var fs = require('fs')
var log = require('bole')('budo')
var asyncDetectSeries = require('async').detectSeries

module.exports = createServer
function createServer (entryHandler, opts) {
  var router = Router()
  var staticPaths = [].concat(opts.dir).filter(Boolean)
  if (staticPaths.length === 0) {
    staticPaths = [ process.cwd() ]
  }

  var staticHandlers = staticPaths.map(function (filepath, i, list) {
    var last = i === list.length - 1
    return ecstatic({ root: filepath, handleError: last })
  })

  var entrySrc = opts.serve
  var live = opts.live
  var middleware = opts.middleware || defaultMiddleware
  if (typeof middleware !== 'function') {
    throw new TypeError('expected opts.middleware to be a function')
  }

  var server = http.createServer(function (req, res) {
    if (middleware.length === 3) {
      var removeLogger = logger('middleware', req, res)
      // user wants to specify which routes to fall through to budo
      middleware(req, res, function (err) {
        removeLogger()
        if (err) {
          var msg = err.message ? err.message : err
          console.error(msg)
          res.statusCode = 400
          res.end(msg)
        } else {
          router(req, res)
        }
      })
    } else {
      // all routes will fall through to budo routes
      // we won't add a logger here to avoid doubling up
      middleware(req, res)
      router(req, res)
    }
  })

  if (entryHandler) {
    var entryRoute = urlParse(entrySrc).pathname
    router.addRoute('/' + entryRoute, function (req, res) {
      logger('generated', req, res)
      entryHandler(req, res)
    })
  }

  router.addRoute('/index.html', home)
  router.addRoute('/', home)
  router.addRoute('/favicon.ico', favicon)
  router.addRoute('*.html?|*[^.]', wildcard(true))
  router.addRoute('*', wildcard())

  // allow user to toggle live reload integration
  server.setLiveOptions = setLiveOptions

  return server

  function logger (type, req, res) {
    var now = Date.now()
    var fn = function () {
      var elapsed = Date.now() - now
      log.info({
        elapsed: elapsed + 'ms',
        name: 'http',
        message: (req.method || 'GET').toUpperCase(),
        url: req.url,
        statusCode: res.statusCode,
        type: type,
        colors: {
          elapsed: elapsed > 1000 ? 'yellow' : 'dim',
          message: 'dim'
        }
      })
    }
    res.once('finish', fn)

    // allow removal
    return function () {
      res.removeListener('finish', fn)
    }
  }

  function favicon (req, res) {
    var maxAge = 345600 // 4 days
    res.setHeader('Cache-Control', 'public, max-age=' + Math.floor(maxAge / 1000))
    res.setHeader('Content-Type', 'image/x-icon')
    res.statusCode = 200
    // should we clutter logs with favicon.ico requests?
    // logger('generated', req, res)
    res.end()
  }

  function defaultMiddleware (req, res, next) {
    next()
  }

  function setLiveOptions (liveOpts) {
    live = liveOpts
  }

  function wildcard (html) {
    return function (req, res) {
      // inject LiveReload into HTML content if needed
      if (html && live && !live.plugin) {
        res = inject(res, live)
      }
      logger('static', req, res)
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
    var homeFiles = staticPaths.map(function (base) {
      return path.join(base, 'index.html')
    })
    asyncDetectSeries(homeFiles, fs.exists, function (result) {
      // inject LiveReload into HTML content if needed
      if (live && !live.plugin) {
        res = inject(res, live)
      }

      var type = result ? 'static' : 'generated'
      logger(type, req, res)

      if (result) {
        staticRequest(req, res)
      } else {
        generateIndex(req, res)
      }
    })
  }

  function generateIndex (req, res) {
    res.setHeader('content-type', 'text/html')

    var stream = opts.defaultIndex || defaultIndex
    stream({
      entry: entrySrc,
      title: opts.title,
      css: opts.css
    }).pipe(res)
  }
}
