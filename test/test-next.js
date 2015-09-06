var test = require('tape')
var budo = require('../')
var http = require('http')
var path = require('path')

test('user can disable portfinding', function (t) {
  t.plan(1)
  var server = http.createServer().listen(9966, function () {
    var b = budo({
      port: 9966,
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
  var server = http.createServer().listen(9966, function () {
    var b = budo({
      port: 9966,
    // livePort: 9966
    })
    b.on('error', t.fail)
    b.on('connect', function (ev) {
      t.equal(ev.port, 9967)
      // t.equal(ev.livePort, 9968)
      b.close()
      server.close()
    })
  })
})

test('gets connect', function (t) {
  t.plan(1)
  var b = budo({
    port: 9966,
    portfind: false
  })
  b.on('connect', function (ev) {
    t.equal(ev.port, 9966)
  })
})
