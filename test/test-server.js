var test = require('tape')
var budo = require('../')

var request = require('request')
var entry = 'test/fixtures/app.js'

test('default should serve on 9966', port(9966))
test('should serve on specified port', port(3000, { port: 3000 }))

test('should serve on --dir', function (t) {
  t.plan(2)
  var app = budo(entry, { dir: __dirname })
    .on('connect', function (ev) {
      request.get({
        uri: ev.uri + 'fixtures/text.txt'
      }, function (err, resp, body) {
        if (err) t.fail(err)
        t.equal(body.toString(), 'foobar', 'text matches')
        app.close()
      })
    })
    .on('exit', function () {
      t.ok(true, 'closed')
    })
    .on('error', t.fail.bind(t))
})

function port (expected, opt) {
  return function (t) {
    t.plan(2)
    var app = budo(entry, opt)
      .on('connect', function (ev) {
        t.ok(ev.port, expected, 'serves on ' + expected)
        app.close()
      })
      .on('exit', function () {
        t.ok(true, 'closed')
      })
      .on('error', t.fail.bind(t))
  }
}
