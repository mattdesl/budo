// TODO: Expose this like webpack-dev-server middleware
var stacked = require('stacked')
var serveStatic = require('serve-static')
var defaultIndex = require('simple-html-index')
var logger = require('./simple-http-logger')
var urlLib = require('url')
var xtend = require('xtend')
var pushState = require('connect-pushstate')
var liveReload = require('inject-lr-script')
var urlTrim = require('url-trim')
var escapeHtml = require('escape-html')

var fs = require('fs')
var browserify = require('browserify')
var path = require('path')
var liveReloadClientFile = path.resolve(__dirname, 'reload', 'client.js')
var bundledReloadClientFile = path.resolve(__dirname, '..', 'build', 'bundled-livereload-client.js')

// Patch 'wasm' since send has not yet been updated to latest 'mime' module
serveStatic.mime.types['wasm'] = 'application/wasm'

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
  var ignoreLog = [].concat(opts.ignoreLog).filter(Boolean)
  var logHandler = logger({
    ignores: [ '/favicon.ico' ].concat(ignoreLog)
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

  // Entry (watchify) middleware
  if (entryMiddleware) {
    var entryRoute = urlLib.parse(entrySrc).pathname
    if (!/^\//.test(entryRoute)) entryRoute = '/' + entryRoute
    handler.use(function (req, res, next) {
      if (urlTrim(req.url) === urlTrim(entryRoute)) {
        entryMiddleware(req, res, next)
      } else {
        next()
      }
    })
  }

  // Re-route for pushState support
  if (opts.pushstate) {
    if (typeof opts.pushstate === 'string') {
      throw new Error('--pushstate is a string, you shouold use subarg options instead')
    }
    var pushStateOpts = xtend(typeof opts.pushstate === 'boolean' ? {} : opts.pushstate)
    delete pushStateOpts._ // added by subarg
    handler.use(pushState(pushStateOpts))
  }

  // Inject liveReload snippet on response
  var liveInjector = liveReload({
    local: true
  })
  // this is lazily set and cannot be changed dynamically
  var liveScriptUrl
  // By default, attempt to optimize the response
  var shouldUseBundledLiveReload = true
  // Cache the client by default to optimize the response
  var liveReloadClient
  handler.use(liveReloadHandler)

  // Ignore favicon clutter
  handler.mount('/favicon.ico', favicon)

  // If the user wishes to *always* serve
  // a generated index instead of a static one.
  if (opts.forceDefaultIndex) {
    handler.use(indexHandler)
  }

  // Static assets (html/images/etc)
  staticPaths.forEach(function (rootFile) {
    var staticOpts = xtend({
      cacheControl: false
    }, opts.staticOptions)
    delete staticOpts._ // from subarg

    var staticHandler = serveStatic(rootFile, staticOpts)
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
      }, req).pipe(res)
    } else {
      next()
    }
  }

  function serveBundledLiveReload (res, successCallback) {
    if (liveReloadClient) {
      res.end(liveReloadClient)
      successCallback(true)
    } else {
      fs.readFile(bundledReloadClientFile, function (err, src) {
        if (err) {
          if (shouldUseBundledLiveReload) {
            console.error([
              'NOTE: The bundled LiveReload client could not be found, so budo will',
              'generate this on the fly.',
              'This is most likely because you are using a git cloned version of budo',
              'instead of installing it from npm.',
              'You can run this from your cloned budo folder to create a build:',
              '  npm run bundle-live-client'
            ].join('\n'))
          }
          shouldUseBundledLiveReload = false
          successCallback(false)
        } else {
          liveReloadClient = src
          res.end(src)
          successCallback(true)
        }
      })
    }
  }

  function serveBrowserifyLiveReload (cache, debug, liveScripts, res) {
    // Browserify the client file, e.g. if user has a script to include
    if (cache && liveReloadClient) {
      res.end(liveReloadClient)
    } else {
      var b = browserify({ debug: debug })
      b.add(liveReloadClientFile)
      if (live.expose) {
        b.require(liveReloadClientFile, { expose: 'budo-livereload' })
      }

      liveScripts.forEach(function (file) {
        b.add(path.resolve(file))
      })
      b.bundle(function (err, src) {
        if (err) {
          console.error('Error bundling LiveReload client:\n' + err.message)
          res.statusCode = 500
          res.end('Error bundling LiveReload client: ' + err)
        } else {
          liveReloadClient = src
          res.end(src)
        }
      })
    }
  }

  function liveReloadHandler (req, res, next) {
    if (!live || live.plugin) return next()
    if (!liveScriptUrl) {
      liveScriptUrl = live.path || '/budo/livereload.js'
      logHandler.ignores.push(liveScriptUrl)
    } else if (liveScriptUrl && live.path && liveScriptUrl !== live.path) {
      var errMessage = 'Error: The LiveReload path field cannot be changed dynamically.\n' +
          'Please open an issue in budo if you have a specific use case for this.'
      console.error(errMessage)
      res.statusCode = 500
      res.end(errMessage)
      return
    }

    if (req.url === liveScriptUrl) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/javascript')
      var liveScripts = (Array.isArray(live.include) ? live.include : [ live.include ]).filter(Boolean)
      var cache = live.cache !== false
      var debug = live.debug

      // Default setup - use a bundled JS file for LiveReload client
      if (shouldUseBundledLiveReload && cache && !debug && liveScripts.length === 0) {
        serveBundledLiveReload(res, function (success) {
          // fall back to browserify on the fly
          if (!success) serveBrowserifyLiveReload(cache, debug, liveScripts, res)
        })
      } else {
        serveBrowserifyLiveReload(cache, debug, liveScripts, res)
      }
    } else {
      liveInjector.path = liveScriptUrl
      liveInjector(req, res, next)
    }
  }
}
