var test = require('tape')
var budo = require('../')

// watchify, chokidar and minilr are a bit stubborn
// if you try to close them immediately after starting
// the watchers.
test('can close on connect with watch/live', function (t) {
  t.plan(2)
  t.timeoutAfter(10000)

  var app = budo('test/fixtures/app.js', {
    dir: __dirname,
    port: 8000
  })
    .live()
    .watch()
    .on('connect', function () {
      t.ok(true, 'connected')
      app.close()
    })
    .on('update', function () {
      t.fail(true, 'got update')
    })
    .on('exit', function () {
      t.ok(true, 'got exit')
    })
})

test('can close on first update', function (t) {
  t.plan(3)
  t.timeoutAfter(10000)

  var app = budo('test/fixtures/app.js', {
    dir: __dirname
  })
    .on('update', function () {
      t.ok(true, 'got update')
      app.close()
    })
    .once('connect', function () {
      t.ok(true, 'connected')
    })
    .on('exit', function () {
      t.ok(true, 'got exit')
    })
})
