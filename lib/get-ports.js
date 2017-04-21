var xtend = require('xtend')
var getPorts = require('get-ports')

module.exports = getServerPorts
function getServerPorts (opt, cb) {
  opt = xtend({ port: 9966 }, opt)

  // try to use exact port specified or the defaults
  if (!opt.portfind) {
    return process.nextTick(function () {
      cb(null, {
        port: opt.port
      })
    })
  }

  // find available ports
  getPorts([ opt.port ], function (err, ports) {
    if (err) return cb(err)
    cb(null, {
      port: ports[0]
    })
  })
}
