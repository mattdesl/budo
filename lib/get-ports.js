var xtend = require('xtend')
var each = require('map-limit')
var net = require('net')
var MAX_PORT = 60000

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

  var basePorts = [ opt.port, opt.livePort ]

  // creates multiple servers
  // once all ports are found, we can close
  // the servers
  each(basePorts, 1, function (base, next) {
    createServer(base, function (err, server) {
      if (err) return next(new Error('max retries for base port ' + base))
      next(null, server)
    })
  }, function (err, servers) {
    // no servers opened
    if (err) return cb(err)

    // once all servers are closed...
    closeServers(servers, done)
  })

  function done (err, ports) {
    if (err) return cb(err)
    cb(null, {
      port: ports[0], livePort: ports[1]
    })
  }
}

// creates a new server at base port w/ max retries
function createServer (basePort, cb) {
  if (basePort >= MAX_PORT) {
    return process.nextTick(function () {
      cb(new Error('out of ports'))
    })
  }
  var server = net.createServer()
  server.listen(basePort, function () {
    cb(null, server)
  })
  server.on('error', function () {
    createServer(basePort + 1, cb)
  })
}

function closeServers (servers, cb) {
  each(servers, 2, function (server, next) {
    var port = server.address().port
    server.on('close', function () {
      next(null, port)
    })
    server.on('error', next)
    server.close()
  }, cb)
}
