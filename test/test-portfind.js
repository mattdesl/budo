var test = require('tape')
var budo = require('../')
var http = require('http')
var path = require('path')

var file = path.join(__dirname, 'fixtures', 'app.js')

test('user can disable portfinding', function (t) {
  t.plan(1)
  var server = http.createServer().listen(9966, function () {
    var b = budo(file, {
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
  t.plan(2)
  var server = http.createServer().listen(9966, function () {
    var b = budo(file, {
      port: 9966,
      livePort: 30000
    })
    b.on('error', t.fail)
    b.on('connect', function (ev) {
      t.equal(ev.port, 9967, 'gets port')
      t.equal(ev.livePort, 30000, 'gets live port')
      b.close()
      server.close()
    })
  })
})

test('gets connect', function (t) {
  t.plan(1)
  var b = budo(file, {
    port: 9966,
    portfind: false
  })
  b.on('connect', function (ev) {
    t.equal(ev.port, 9966)
    b.close()
  })
})

test('robust portfinding', function (t) {
  t.plan(2)
  var server0, server1
  
  server0 = http.createServer().listen(8888, function () {
    server1 = http.createServer().listen(8889, start)
    server1.on('error', t.fail)
  }).on('error', t.fail)
  
  function start() {
    var b = budo(file, {
      port: 8888,
      livePort: 8888
    })
    b.on('connect', function (ev) {
      t.equal(ev.port, 8890)
      t.equal(ev.livePort, 8891)
      b.close()
      server0.close()
      server1.close()
    })
    b.on('error', t.fail)
  }
})
