// TODO: Expose this like webpack-dev-server middleware
var stacked = require('stacked')
var serveStatic = require('serve-static')
var defaultIndex = require('simple-html-index')
var logger = require('./simple-http-logger')
var urlLib = require('url')
var pushState = require('connect-pushstate')
var liveReload = require('inject-lr-script')
var urlTrim = require('url-trim')
var escapeHtml = require('escape-html')

module.exports = budoMiddleware
function budoMiddleware (entryMiddleware, opts) {
  opts = opts || {}
  var staticPaths = [].concat(opts.dir).filter(Boolean)
  if (staticPaths.length === 0) {
    staticPaths = [ process.cwd() ]
  }

  var entrySrc = opts.serve
  var live = opts.live
  var cors = opts.cors
  var handler = stacked()
  var middlewares = [].concat(opts.middleware).filter(Boolean)

  // Everything is logged except favicon.ico
  var logHandler = logger({
    ignore: [ '/favicon.ico' ]
  })
  handler.use(function (req, res, next) {
    if (cors) {
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With')
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST')
      res.setHeader('Access-Control-Allow-Origin', '*')
    }
    logHandler(req, res, next)
  })

  // User middleware(s) can override others
  middlewares.forEach(function (middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('middleware options must be functions')
    }
    handler.use(function (req, res, next) {
      logHandler.type = 'middleware'
      middleware(req, res, next)
    })
  })

  // Re-route for pushState support
  if (opts.pushstate) handler.use(pushState())

  // Inject liveReload snippet on response
  var liveInjector = liveReload()
  handler.use(function (req, res, next) {
    if (!live || live.plugin) return next()
    if (live.host) liveInjector.host = live.host
    if (live.port) liveInjector.port = live.port
    liveInjector(req, res, next)
  })

  // Entry (watchify) middleware
  if (entryMiddleware) {
    var entryRoute = '/' + urlLib.parse(entrySrc).pathname
    handler.use(function (req, res, next) {
      if (urlTrim(req.url) === urlTrim(entryRoute)) {
        entryMiddleware(req, res, next)
      } else {
        next()
      }
    })
  }

  // Ignore favicon clutter
  handler.mount('/favicon.ico', favicon)

  // If the user wishes to *always* serve
  // a generated index instead of a static one.
  if (opts.forceDefaultIndex) {
    handler.use(indexHandler)
  }

  // Static assets (html/images/etc)
  staticPaths.forEach(function (rootFile) {
    var staticHandler = serveStatic(rootFile, {
      cacheControl: false
    })
    handler.use(function (req, res, next) {
      logHandler.type = 'static'
      staticHandler(req, res, next)
    })
  })

  // Generates a default index.html
  // when none is found locally.
  handler.use(indexHandler)

  // Handle errors
  handler.use(function (req, res) {
    res.statusCode = 404
    res.end('404 not found: ' + escapeHtml(req.url))
  })

  // Allow live options to be changed at runtime
  handler.setLiveOptions = setLiveOptions
  return handler

  function setLiveOptions (opts) {
    live = opts
  }

  function favicon (req, res) {
    var maxAge = 345600 // 4 days
    res.setHeader('Cache-Control', 'public, max-age=' + Math.floor(maxAge / 1000))
    res.setHeader('Content-Type', 'image/x-icon')
    res.statusCode = 200
    res.end()
  }

  function indexHandler (req, res, next) {
    if (urlLib.parse(req.url).pathname === '/' || /\/index.html?/i.test(req.url)) {
      // If we reach this, our response will be generated
      // (not static from local file system)
      logHandler.type = 'generated'
      res.setHeader('content-type', 'text/html')

      var stream = opts.defaultIndex || defaultIndex
      stream({
        entry: entrySrc,
        title: opts.title,
        css: opts.css,
        base: opts.base === true ? '/' : (opts.base || null)
      }).pipe(res)
    } else {
      next()
    }
  }
}
