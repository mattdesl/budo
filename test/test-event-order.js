var test = require('tape')
var budo = require('../')
var path = require('path')

test('event order should be correct', function (t) {
  t.plan(1)

  var fixture = path.resolve(__dirname, 'fixtures', 'app.js')
  var hasConnected = false
  var hasUpdated = false
  var app = budo(fixture)
    .once('connect', function () {
      if (hasUpdated) {
        app.close()
        t.fail('update before connect')
      }
      hasConnected = true
    })
    .once('update', function () {
      hasUpdated = true
      t.equal(hasConnected, true, 'got update after connect')
      app.close()
    })
})
