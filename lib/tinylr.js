//a thin wrapper around tiny-lr module
var log = require('bole')('budo')
var xtend = require('xtend')
var tinylr = require('tiny-lr')

module.exports = function(opt) {
  opt = xtend(opt)
  opt.host = opt.host || 'localhost'
  if (typeof opt.port !== 'number')
    opt.port = 35729
  
  var server = tinylr()
  var closed = false

  server.listen(opt.port, opt.host, function(a) {
    if (closed)
      return
    log.info('livereload running on ' + opt.port)
  })

  var serverImpl = server.server
  serverImpl.removeAllListeners('error')
  serverImpl.on('error', function(err) {
    if (err.code === 'EADDRINUSE') {
      process.stderr.write('ERROR: livereload not started, port ' + opt.port + ' is in use\n')
      server.close()
      closed = true
    }
  })

  return {
    close: function close() {
      if (closed)
        return
      server.close()
      closed = true
    },

    reload: function reload(path) {
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