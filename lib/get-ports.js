var getport = require('getport')
var xtend = require('xtend')
var each = require('async-each')

module.exports = getServerPorts
function getServerPorts (opt, cb) {
  opt = xtend({ port: 9966, livePort: 35729 }, opt)

  // try to use exact port specified or the defaults
  if (!opt.portfind) {
    return process.nextTick(function () {
      cb(null, {
        port: opt.port,
        livePort: opt.livePort
      })
    })
  }

  var tasks = [ opt.port ]
  if (opt.live) {
    tasks.push(opt.livePort)
  }

  each(tasks, function (base, next) {
    getport(base, function (err, port) {
      if (err) return next(new Error('no available ports after ' + base))
      next(null, port)
    })
  }, function (err, ports) {
    if (err) return cb(err)
    cb(null, { port: ports[0], livePort: ports[1]})
  })
}
