var log = require('bole')('budo')

module.exports = simpleHttpLoggerMiddleware
function simpleHttpLoggerMiddleware (opts) {
  opts = opts || {}
  var ignores = [].concat(opts.ignore).filter(Boolean)

  var httpLogger = function simpleHttpLogger (req, res, next) {
    if (ignores.indexOf(req.url) >= 0) return next()
    if (!req.url) return next()

    var byteLength = 0
    var now = Date.now()
    var onFinished = function () {
      var elapsed = Date.now() - now
      log.info({
        elapsed: elapsed,
        contentLength: byteLength,
        method: (req.method || 'GET').toUpperCase(),
        url: req.url,
        statusCode: res.statusCode,
        type: httpLogger.type === 'static' ? undefined : httpLogger.type,
        colors: {
          elapsed: elapsed > 1000 ? 'yellow' : 'dim'
        }
      })
    }

    var isAlreadyLogging = res._simpleHttpLogger
    res._simpleHttpLogger = true

    if (!isAlreadyLogging) {
      var write = res.write
      res.once('finish', onFinished)

      // catch content-length of payload
      res.write = function (payload) {
        if (payload) byteLength += payload.length
        res.write = write
        res.write.apply(res, arguments)
      }
    }

    next()
  }

  httpLogger.type = 'static'
  return httpLogger
}
