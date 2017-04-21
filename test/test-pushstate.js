var test = require('tape')
var budo = require('../')
var path = require('path')
var request = require('request')

var file = path.join(__dirname, 'fixtures', 'app.js')
var html = '<!DOCTYPE html><html lang="en" dir="ltr"><head><title>budo</title><meta charset="utf-8"></head><body><script src="app.js"></script></body></html>'

test('pushstate flag', function (t) {
  t.plan(1)
  var b = budo(file, {
    pushstate: true
  }).on('connect', function (ev) {
    request({ uri: ev.uri + '/foobar' }, function (err, resp, body) {
      b.close()
      if (err) return t.fail(err)
      t.equal(body, html, 'returns home index.html')
    })
  })
})

test('pushstate serve static', function (t) {
  t.plan(1)
  var b = budo(file, {
    port: 9966,
    pushstate: true
  }).on('connect', function (ev) {
    request({ uri: ev.uri + 'app.js' }, function (err, resp, body) {
      b.close()
      if (err) return t.fail(err)
      t.equal(resp.statusCode, 200, '200 OK')
    })
  })
})

test('pushstate-allow', function (t) {
  t.plan(1)
  var b = budo(file, {
    port: 9966,
    pushstate: {
      allow: '/app.js'
    }
  }).on('connect', function (ev) {
    request({ uri: ev.uri + '/app.js' }, function (err, resp, body) {
      b.close()
      if (err) return t.fail(err)
      t.equal(resp.statusCode, 404, '404 Not found')
    })
  })
})

test('pushstate-disallow', function (t) {
  t.plan(2)
  var b = budo(file, {
    port: 9966,
    pushstate: {
      disallow: '/foo.bar'
    }
  }).on('connect', function (ev) {
    request({ uri: ev.uri + '/foo.bar' }, function (err, resp, body) {
      b.close()
      if (err) return t.fail(err)
      t.equal(resp.statusCode, 200, '200 OK')
      t.equal(body, html, 'returns home index.html')
    })
  })
})
