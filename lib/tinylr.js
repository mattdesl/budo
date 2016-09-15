'use strict'

// a thin wrapper around tiny-lr module
const log = require('bole')('budo')
const xtend = require('xtend')
const tinylr = require('tiny-lr')

module.exports = (opt) => {
  opt = xtend(opt)
  if (typeof opt.port !== 'number') {
    opt.port = 35729
  }

  const server = tinylr({
    cert: opt.cert,
    key: opt.key
  })
  let closed = false
  let ready = false

  server.listen(opt.port, opt.host || undefined, function () {
    ready = true
    if (closed) return server.close()
    log.info({ message: 'LiveReload running on ' + opt.port })
  })

  const serverImpl = server.server
  serverImpl.removeAllListeners('error')
  serverImpl.on('error', function (err) {
    if (err.code === 'EADDRINUSE') {
      process.stderr.write('ERROR: livereload not started, port ' + opt.port + 'is in use\n')
    } else {
      process.stderr.write((err.stack ? err.stack : err) + '\n')
    }
    close()
  })

  const close = () => {
    if (closed) return
    if (ready) server.close()
    closed = true
  }

  const reload = (path) => {
    try {
      server.changed({
        body: {
          files: path ? [ path ] : '*'
        }
      })
    } catch (e) {
      throw e
    }
  }
  return {
    close,
    reload
  }
}
