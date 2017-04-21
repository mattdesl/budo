var test = require('tape')
var budo = require('../')
var http = require('http')
var path = require('path')
var getPorts = require('get-ports')

var file = path.join(__dirname, 'fixtures', 'app.js')

getPorts([ 9966, 9967 ], function (err, ports) {
  if (err) throw new Error('Could not get base ports in test-portfind.js')
  runTests(ports[0], ports[1])
})

function runTests (basePort, nextPort) {
  test('user can disable portfinding', function (t) {
    t.plan(1)
    var server = http.createServer().listen(basePort, function () {
      var b = budo(file, {
        port: basePort,
        portfind: false
      })
      b.on('error', function (err) {
        t.equal(err.code, 'EADDRINUSE')
        b.close()
        server.close()
      })
    })
  })

  test('portfinds by default', function (t) {
    t.plan(1)
    var server = http.createServer().listen(basePort, function () {
      var b = budo(file, {
        port: basePort
      })
      b.on('error', t.fail)
      b.on('connect', function (ev) {
        t.equal(ev.port, nextPort, 'gets port')
        b.close()
        server.close()
      })
    })
  })

  test('gets connect', function (t) {
    t.plan(1)
    var b = budo(file, {
      port: basePort,
      portfind: false
    })
    b.on('connect', function (ev) {
      t.equal(ev.port, basePort)
      b.close()
    })
  })
}
