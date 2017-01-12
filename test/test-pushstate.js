var test = require('tape')
var budo = require('../')
var path = require('path')
var request = require('request')

var file = path.join(__dirname, 'fixtures', 'app.js')
var html = '<!DOCTYPE html><html lang="en" dir="ltr"><head><title>budo</title><meta charset="utf-8"></head><body><script src="app.js"></script></body></html>'

test('pushstate', function (t) {
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
