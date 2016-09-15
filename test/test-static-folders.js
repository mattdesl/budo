var test = require('tape')
var budo = require('../')
var path = require('path')
var request = require('request')

var path1 = path.resolve(__dirname, 'fixtures', 'one')
var path2 = path.resolve(__dirname, 'fixtures', 'two')
var path3 = path.resolve(__dirname, 'fixtures', 'three')

test('should serve multiple folders', function (t) {
  t.plan(2)

  var app = budo({
    dir: [ path1, path2 ]
  }).on('connect', function (ev) {
    request.get({ uri: ev.uri + 'one.txt' }, function (err, res, body) {
      if (err) return t.fail(err)
      t.equal(body, 'one', 'gets one')
      request.get({ uri: ev.uri + 'two.txt' }, function (err, res, body) {
        if (err) return t.fail(err)
        t.equal(body, 'two', 'gets two')
        app.close()
      })
    })
  })
})

test('should find any index.html', function (t) {
  t.plan(1)

  var expected = '<!DOCTYPE html><html lang="en" dir="ltr"><head><meta charset="UTF-8"><title>TWO</title></head><body></body></html>'
  var app = budo({
    dir: [ path1, path2 ]
  }).on('connect', function (ev) {
    request.get({ uri: ev.uri + 'index.html' }, function (err, res, body) {
      if (err) return t.fail(err)
      t.equal(body, expected, 'gets any index.html in all static folders')
      app.close()
    })
  })
})

test('should find the first index.html', function (t) {
  t.plan(1)

  var expected = '<!DOCTYPE html><html lang="en" dir="ltr"><head><meta charset="UTF-8"><title>THREE</title></head><body></body></html>'
  var app = budo({
    dir: [ path1, path3, path2 ]
  }).on('connect', function (ev) {
    request.get({ uri: ev.uri + 'index.html' }, function (err, res, body) {
      if (err) return t.fail(err)
      t.equal(body, expected, 'gets the first index.html in all static folders')
      app.close()
    })
  })
})
