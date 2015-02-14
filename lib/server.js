var ecstatic = require('ecstatic')
var Router = require('routes-router')
var http = require('http')
var fs = require('fs')
var path = require('path')
var log = require('bole')('mystc')
var fs = require('fs')
var defaultIndex = require('./default-index')

module.exports.http = function(opts) {
    var handler = module.exports.static(opts)
    return http.createServer(handler)
}

module.exports.static = function(opts) {
    var basedir = opts.path || process.cwd()
    var staticHandler = ecstatic(basedir)
    var router = Router()

    var out = opts.output
    var entryHandler = ecstatic({ root: out.dir })
    
    router.addRoute('/' + out.to, function(req, res, params) {
        log.info({ url: req.url, type: 'static' })
        module.exports.entry(out.from, req, res)
    })

    router.addRoute('/', function(req, res, params) {
        fs.exists(path.join(basedir, 'index.html'), function(exists) {
            if (exists) return staticHandler(req, res)
            else {
                log.info({ url: req.url, type: 'generated' })
                generateIndex(out.to, req, res)
            }
        })
    })

    router.addRoute('*', function(req, res, params) {
        log.info({ url: req.url, type: 'static' })
        staticHandler(req, res)
    })

    return router

    function generateIndex(outfile, req, res) {
        res.setHeader('content-type', 'text/html')
        res.end(defaultIndex(outfile))
    }
}



module.exports.entry = function(entry, req, res) {
  res.setHeader('content-type', 'text/javascript')

  fs.exists(entry, function(exists) {
    if (exists) {
      fs.readFile(entry, function(error, buffer) {
        if (error) {
          res.statusCode = 500
          res.end()
          process.stderr.write(error+'\n')
          return
        }
        res.statusCode = 200
        res.end(buffer)
      })
    } else {
      res.statusCode = 404
      res.end()
      log.warn({ url: req.url, type: 'static', message: 'not found' })
    }
  })
}