var test = require('tape')
var budo = require('../')
var path = require('path')
var request = require('request')

var file = path.join(__dirname, 'fixtures', 'app.js')
var html = '<!DOCTYPE html><html lang="en" dir="ltr"><head><title>budo</title><meta charset="utf-8"><base href="${base}"></head><body><script src="app.js"></script></body></html>'

test('base default', function (t) {
  t.plan(1)
  var b = budo(file, {
    port: 9966,
    base: true,
    portfind: false
  }).on('connect', function (ev) {
    request({ uri: ev.uri }, function (err, resp, body) {
      b.close()
      if (err) return t.fail(err)
      t.equal(body, html.replace('${base}', '/'), 'returns home index.html')
    })
  })
})

test('base with value', function (t) {
  t.plan(1)
  var b = budo(file, {
    port: 9966,
    base: '/xyz',
    portfind: false
  }).on('connect', function (ev) {
    request({ uri: ev.uri }, function (err, resp, body) {
      b.close()
      if (err) return t.fail(err)
      t.equal(body, html.replace('${base}', '/xyz'), 'returns home index.html')
    })
  })
})
