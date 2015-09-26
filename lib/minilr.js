// a thin wrapper around mini-lr module
var log = require('bole')('budo')
var xtend = require('xtend')
var minilr = require('mini-lr')

module.exports = function (opt) {
  opt = xtend(opt)
  opt.host = opt.host || 'localhost'
  if (typeof opt.port !== 'number') {
    opt.port = 35729
  }

  var server = minilr({
    livereload: require.resolve('livereload-js/dist/livereload.js')
  })
  var closed = false
  var ready = false

  server.listen(opt.port, opt.host, function () {
    ready = true
    if (closed) return server.close()
    log.info({ message: 'LiveReload running on ' + opt.port })
  })

  var serverImpl = server.server
  serverImpl.removeAllListeners('error')
  serverImpl.on('error', function (err) {
    if (err.code === 'EADDRINUSE') {
      process.stderr.write('ERROR: livereload not started, port ' + opt.port + ' is in use\n')
    } else {
      process.stderr.write((err.stack ? err.stack : err) + '\n')
    }
    close()
  })

  function close () {
    if (closed) return
    if (ready) server.close()
    closed = true
  }

  return {
    close: close,

    reload: function reload (path) {
      // this starts to clutter things a bit ...
      // log.info({ name: 'live', url: path, type: 'reload' })
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
  }
}
