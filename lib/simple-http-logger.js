'use strict'
const log = require('bole')('budo')

const simpleHttpLoggerMiddleware = (opts) => {
  opts = opts || {}
  const ignores = [].concat(opts.ignore).filter(Boolean)

  const httpLogger = (req, res, next) => {
    if (ignores.indexOf(req.url) >= 0) return next()
    if (!req.url) return next()

    let byteLength = 0
    const now = Date.now()
    const onFinished = () => {
      const elapsed = Date.now() - now
      log.info({
        elapsed,
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

    const isAlreadyLogging = res._simpleHttpLogger
    res._simpleHttpLogger = true

    if (!isAlreadyLogging) {
      const write = res.write
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

module.exports = simpleHttpLoggerMiddleware
