var test = require('tape')
var through = require('through2')
var budo = require('../')

var entry = 'test/fixtures/app.js'

test('should log properly after restarting the server', function (t) {
  var out = through.obj(function (item, _, next) {
    t.ok(item, 'log message')
    next()
  })

  // 2 messages for each server run: 1 for server startup and 1 for bundle complete
  t.plan(4)
  // start a self-closing server, and then do it again (once) when it exits
  start().once('exit', start)

  function start () {
    var b = budo(entry, {
      dir: __dirname,
      stream: out,
      ndjson: true
    })

    return b.once('connect', function (ev) {
      b.close()
    })
    .on('error', t.fail.bind(t))
  }
})

