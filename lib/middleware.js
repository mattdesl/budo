'use strict'

// TODO: Expose this like webpack-dev-server middleware
const stacked = require('stacked')
const serveStatic = require('serve-static')
const defaultIndex = require('simple-html-index')
const logger = require('./simple-http-logger')
const urlLib = require('url')
const pushState = require('connect-pushstate')
const liveReload = require('inject-lr-script')
const urlTrim = require('url-trim')

const budoMiddleware = (entryMiddleware, opts) => {
  opts = opts || {}
  let staticPaths = [].concat(opts.dir).filter(Boolean)
  if (staticPaths.length === 0) {
    staticPaths = [ process.cwd() ]
  }

  let live = opts.live
  const middlewares = [].concat(opts.middleware).filter(Boolean)
  const entrySrc = opts.serve
  const cors = opts.cors
  const handler = stacked()
  const setLiveOptions = (opts) => {
    live = opts
  }
  const favicon = (req, res) => {
    const maxAge = 345600 // 4 days
    res.setHeader('Cache-Control', 'public, max-age=' + Math.floor(maxAge / 1000))
    res.setHeader('Content-Type', 'image/x-icon')
    res.statusCode = 200
    res.end()
  }
  const indexHandler = (req, res, next) => {
    if (urlLib.parse(req.url).pathname === '/' || /\/index.html?/i.test(req.url)) {
      // If we reach this, our response will be generated
      // (not static from local file system)
      logHandler.type = 'generated'
      res.setHeader('content-type', 'text/html')

      const stream = opts.defaultIndex || defaultIndex
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
  // Everything is logged except favicon.ico
  const logHandler = logger({
    ignore: [ '/favicon.ico' ]
  })
  handler.use((req, res, next) => {
    if (cors) {
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With')
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST')
      res.setHeader('Access-Control-Allow-Origin', '*')
    }
    logHandler(req, res, next)
  })

  // User middleware(s) can override others
  middlewares.forEach((middleware) => {
    if (typeof middleware !== 'function') {
      throw new Error('middleware options must be functions')
    }
    handler.use((req, res, next) => {
      logHandler.type = 'middleware'
      middleware(req, res, next)
    })
  })

  // Re-route for pushState support
  if (opts.pushstate) handler.use(pushState())

  // Inject liveReload snippet on response
  const liveInjector = liveReload()
  handler.use((req, res, next) => {
    if (!live || live.plugin) return next()
    if (live.host) liveInjector.host = live.host
    if (live.port) liveInjector.port = live.port
    liveInjector(req, res, next)
  })

  // Entry (watchify) middleware
  if (entryMiddleware) {
    const entryRoute = '/' + urlLib.parse(entrySrc).pathname
    handler.use((req, res, next) => {
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
  staticPaths.forEach((rootFile) => {
    const staticHandler = serveStatic(rootFile)
    handler.use((req, res, next) => {
      logHandler.type = 'static'
      staticHandler(req, res, next)
    })
  })

  // Generates a default index.html
  // when none is found locally.
  handler.use(indexHandler)

  // Handle errors
  handler.use((req, res) => {
    res.statusCode = 404
    res.end('404 not found: ' + req.url)
  })

  // Allow live options to be changed at runtime
  handler.setLiveOptions = setLiveOptions
  return handler
}

module.exports = budoMiddleware
