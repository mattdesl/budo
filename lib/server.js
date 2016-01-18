// TODO: https support
var http = require('http')
var createMiddleware = require('./middleware')

module.exports = function createServer (entryMiddleware, opts) {
  var handler = createMiddleware(entryMiddleware, opts)
  var server = http.createServer(handler)
  server.setLiveOptions = handler.setLiveOptions
  return server
}
