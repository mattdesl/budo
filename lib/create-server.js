var http = require('http')
var path = require('path')
var defaultIndex = require('simple-html-index')
var ecstatic = require('ecstatic')
var Router = require('routes-router')
var inject = require('inject-lr-script')
var fs = require('fs')
var log = require('bole')('budo')
var url = require('url')

module.exports = createServer
function createServer (middleware, opts) {
  var router = Router()
  var staticPaths = opts.dir
  var basedir = staticPaths[0] || process.cwd()
  var staticHandler = ecstatic(basedir)

  var server = http.createServer(router)
  var live = opts.live

  router.addRoute('/index.html', home)
  router.addRoute('/', home)
  // router.addRoute('*.html', wildcard(true))
  // router.addRoute('*', wildcard())

  if (middleware) {
    router.addRoute('/' + opts.serve, function (req, res) {
      log.info({
        url: req.url,
        type: 'generated'
      })
      middleware(req, res)
    })
  }

  // allow user to toggle live reload integration
  server.setLive = setLive
  return server

  function setLive (liveOpts) {
    live = liveOpts
  }

  function home (req, res) {
    fs.exists(path.join(basedir, 'index.html'), function (exists) {
      // inject LiveReload into HTML content if needed
      if (live)
        res = inject(res, live)

      var type = exists ? 'static' : 'generated'
      log.info({
        url: req.url,
        type: type
      })

      if (exists) {
        staticHandler(req, res)
      } else {
        generateIndex(opts.serve, req, res)
      }
    })
  }

  function generateIndex (outfile, req, res) {
    res.setHeader('content-type', 'text/html')

    var stream = opts.defaultIndex || defaultIndex
    stream({
      entry: outfile,
      title: 'budo'
    }).pipe(res)
  }
}
