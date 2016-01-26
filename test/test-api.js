var test = require('tape')
var budo = require('../')
var through = require('through2')
var internalIp = require('internal-ip')

test('uses internal IP when no host is given', function (t) {
  t.plan(3)
  t.timeoutAfter(10000)
  var internal = internalIp()

  var app = budo('test/fixtures/app.js', {
    dir: __dirname,
    port: 8000
  })
    .on('error', function (err) {
      t.fail(err)
    })
    .on('connect', function (ev) {
      t.equal(ev.uri, 'http://' + internal + ':8000/', 'uri matches')
      t.equal(ev.host, internal, 'host defaults to internal ip')
      app.close()
    })
    .on('reload', function () {
      t.fail('should not have received reload event')
    })
    .on('watch', function () {
      t.fail('should not have received watch event')
    })
    .on('exit', function () {
      t.ok(true, 'closing')
    })
})

test('gets connect info', function (t) {
  t.plan(7)
  t.timeoutAfter(10000)

  var app = budo('test/fixtures/app.js', {
    dir: __dirname,
    host: 'localhost',
    port: 8000
  })
    .on('error', function (err) {
      t.fail(err)
    })
    .on('connect', function (ev) {
      t.deepEqual(ev.entries, [ 'test/fixtures/app.js' ], 'entries matches')
      t.equal(ev.serve, 'app.js', 'mapping matches')
      t.equal(ev.uri, 'http://localhost:8000/', 'uri matches')
      t.equal(ev.host, 'localhost', 'host is specified')
      t.equal(ev.port, 8000, 'port matches')
      t.equal(ev.dir, __dirname, 'dir matches')
      app.close()
    })
    .on('reload', function () {
      t.fail('should not have received reload event')
    })
    .on('watch', function () {
      t.fail('should not have received watch event')
    })
    .on('exit', function () {
      t.ok(true, 'closing')
    })
})

test('entry mapping', function (t) {
  t.plan(2)
  t.timeoutAfter(10000)

  var app = budo(['test/fixtures/app:foo.js', 'test/fixtures/with space.js'])
    .on('connect', function (ev) {
      t.equal(ev.serve, 'foo.js', 'mapping matches')
      t.deepEqual(ev.entries, ['test/fixtures/app', 'test/fixtures/with space.js'], 'from matches')
      app.close()
    })
})

test('--serve allows explicit bundle renaming', function (t) {
  t.plan(2)
  t.timeoutAfter(5000)

  var app = budo(['test/fixtures/app', 'test/fixtures/with space.js'], {
    serve: 'static/foo.js'
  })
    .on('connect', function (ev) {
      t.equal(ev.serve, 'static/foo.js', 'mapping matches')
      t.deepEqual(ev.entries, ['test/fixtures/app', 'test/fixtures/with space.js'], 'from matches')
      app.close()
    })
})

test('sets watch() and live() by default with live: true', function (t) {
  t.plan(4)
  t.timeoutAfter(3000)

  var app = budo('test/fixtures/app.js', {
    dir: __dirname,
    port: 8000,
    live: true
  })
    // the order is pending -> reload -> update
    .once('pending', function () {
      // bundle.js started changing
      t.ok(true, 'got pending')
    })
    .once('update', function () {
      // bundle.js changed
      t.ok(true, 'got update event')
      app.close()
    })
    .once('reload', function () {
      // LiveReload triggered
      t.ok(true, 'got reload event')
    })
    .on('error', function (err) {
      t.fail(err)
    })
    .on('exit', function () {
      t.ok(true, 'closing')
    })
})

test('should pipe JSON to specified stream', function (t) {
  t.plan(3)
  t.timeoutAfter(10000)

  var app = budo('test/fixtures/app.js', {
    dir: __dirname,
    ndjson: true,
    stream: through(function (buf) {
      t.ok(buf.length > 0, 'got some message')
      t.doesNotThrow(function () {
        return JSON.parse(buf.toString())
      }, 'produces valid JSON')
      app.close()
    })
  })
    .on('exit', function () {
      t.ok(true, 'got exit event')
    })
})

test('allow setting live() manually', function (t) {
  t.plan(3)
  t.timeoutAfter(10000)

  var app = budo('test/fixtures/app.js', {
    dir: __dirname,
    port: 8000,
    live: false
  })
    .live() // start live server with watchify
    .on('update', function () {
      t.ok(true, 'got update')
      app.reload()
    })
    .on('reload', function () {
      t.ok(true, 'got reload')
      app.close()
    })
    .on('exit', function () {
      t.ok(true, 'got exit')
    })
})
