var test = require('tape')
var budo = require('../')
var http = require('http')

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
      port: 9966
    })
    b.on('error', t.fail)
    b.on('connect', function (ev) {
      t.equal(ev.port, 9967)
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
