var http = require('http')
var path = require('path')
var defaultIndex = require('simple-html-index')
var ecstatic = require('ecstatic')
var Router = require('routes-router')
var inject = require('inject-lr-script')
var fs = require('fs')
var log = require('bole')('budo')

module.exports = createServer
function createServer (middleware, opts) {
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

  var server = http.createServer(router)
  var live = opts.live

  if (middleware) {
    router.addRoute('/' + opts.serve, function (req, res) {
      log.info({
        url: req.url,
        type: 'generated'
      })
      middleware(req, res)
    })
  }

  router.addRoute('/index.html', home)
  router.addRoute('/', home)
  router.addRoute('*.html', wildcard(true))
  router.addRoute('*', wildcard())

  // allow user to toggle live reload integration
  server.setLiveOptions = setLiveOptions
  return server

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
