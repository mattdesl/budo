var serveIndex = require('serve-index')
module.exports = function (opts) {
  return serveIndex(__dirname)
}
