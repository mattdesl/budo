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
    return http.createServer(handler)
}

module.exports.static = function(opts) {
    var basedir = opts.dir || process.cwd()
    var staticHandler = ecstatic(basedir)
    var router = Router()

    var live = opts.live

    var out = opts.output
    var entryHandler = staticHandler
    if (out.tmp) 
        entryHandler = ecstatic({ root: out.dir })
    router.addRoute('/' + out.to, function(req, res, params) {
        log.info({ url: req.url, type: 'static' })
        entryHandler(req, res)
    })

    router.addRoute('/', function(req, res, params) {
        fs.exists(path.join(basedir, 'index.html'), function(exists) {
            //inject LiveReload into HTML content if needed
            if (live)
                res = inject(res, {
                    host: opts.host,
                    port: opts['live-port']
                })

            var type = exists ? 'static' : 'generated'
            log.info({ url: req.url, type: type })

            if (exists) 
                staticHandler(req, res)
            else 
                generateIndex(out.to, req, res)
        })
    })

    router.addRoute('*', function(req, res, params) {
        log.info({ url: req.url, type: 'static' })
        staticHandler(req, res)
    })

    return router

    function generateIndex(outfile, req, res) {
        res.setHeader('content-type', 'text/html')
        html({ outfile: outfile }).pipe(res)
    }
}