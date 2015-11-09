var test = require('tape')
var budo = require('../')
var path = require('path')
var request = require('request')

var path1 = path.resolve(__dirname, 'fixtures', 'one')
var path2 = path.resolve(__dirname, 'fixtures', 'two')

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

// currently failing
/*
test('should find any index.html', function (t) {
  t.plan(2)

  var expected = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>TWO</title></head><body></body></html>'
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
*/
