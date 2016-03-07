var http = require('http')
var https = require('https')
var createMiddleware = require('./middleware')
var fs = require('fs')

module.exports = function createServer (entryMiddleware, opts) {
  var httpsOpts = opts.ssl ? {
    cert: fs.readFileSync(opts.cert || 'cert.pem'),
    key: fs.readFileSync(opts.key || 'key.pem')
  } : undefined

  var handler = createMiddleware(entryMiddleware, opts)
  var server = httpsOpts
    ? https.createServer(httpsOpts, handler)
    : http.createServer(handler)
  server.setLiveOptions = handler.setLiveOptions
  return server
}
