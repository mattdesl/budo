var test = require('tape')
var budo = require('../')
var path = require('path')
var request = require('request')
var fs = require('fs')
var source = fs.readFileSync(path.join(__dirname, 'fixtures', 'app.js'), 'utf8')
var internalIp = require('internal-ip')

test('should inject LiveReload snippet', function (t) {
  t.plan(4)
  t.timeoutAfter(10000)

  var entry = path.join(__dirname, 'fixtures', 'app.js')
  var app = budo(entry, {
    dir: __dirname,
    port: 8000,
    host: 'localhost',
    serve: 'app.js',
    live: true
  })
    .on('error', function (err) {
      t.fail(err)
    })
    .once('update', function () {
      t.ok(true, 'update event triggered')
      app.close()
    })
    .on('reload', function (file) {
      t.equal(file, 'app.js', 'reload event triggered')
    })
    .on('connect', function (ev) {
      matchesHTML(t, ev.uri)
      setTimeout(function () {
        fs.writeFile(entry, source)
      }, 1000)
    })
    .on('exit', function () {
      t.ok(true, 'closing')
    })
})

test('manual LiveReload triggering', function (t) {
  t.plan(4)
  t.timeoutAfter(10000)

  var entry = path.join(__dirname, 'fixtures', 'app.js')
  var app = budo(entry, {
    dir: __dirname,
    port: 8000,
    host: 'localhost',
    serve: 'app.js'
  })
    .watch()
    .live()
    .on('error', function (err) {
      t.fail(err)
    })
    .on('update', function (file) {
      t.equal(Buffer.isBuffer(file), true, 'update event triggered')
      app.reload('app.js')
    })
    .on('reload', function (file) {
      t.equal(file, 'app.js', 'reload event triggered')
      app.close()
    })
    .on('connect', function (ev) {
      matchesHTML(t, ev.uri)
      setTimeout(function () {
        fs.writeFile(entry, source)
      }, 1000)
    })
    .on('exit', function () {
      t.ok(true, 'closing')
    })
})

test('should not inject LiveReload snippet', function (t) {
  t.plan(2)
  t.timeoutAfter(10000)

  var entry = path.join(__dirname, 'fixtures', 'app.js')
  var app = budo(entry, {
    dir: __dirname,
    port: 8000,
    host: 'localhost',
    serve: 'app.js'
  })
    .live({ plugin: true })
    .on('error', function (err) {
      t.fail(err)
    })
    .on('connect', function (ev) {
      matchesHTML(t, ev.uri, getHTMLNoLive(), function () {
        app.close()
      })
    })
    .on('exit', function () {
      t.ok(true, 'closing')
    })
})

test('LiveReload snippet host should default to budo host', function (t) {
  t.plan(2)
  t.timeoutAfter(10000)

  var addr = internalIp()
  var entry = path.join(__dirname, 'fixtures', 'app.js')
  var app = budo(entry, {
    dir: __dirname,
    port: 8000,
    host: addr,
    serve: 'app.js'
  })
    .live()
    .on('error', function (err) {
      t.fail(err)
    })
    .on('connect', function (ev) {
      matchesHTML(t, ev.uri, getHTMLWithHost(addr), function () {
        app.close()
      })
    })
    .on('exit', function () {
      t.ok(true, 'closing')
    })
})

function matchesHTML (t, uri, html, cb) {
  request.get({ uri: uri + 'index.html' }, function (err, resp, body) {
    if (err) t.fail(err)
    t.equal(body, html || getHTML(), 'matches expected HTML')

    if (cb) cb()
  })
}

function getHTMLNoLive () {
  return '<!DOCTYPE html><html lang="en" dir="ltr"><head><title>budo</title><meta charset="utf-8"></head><body><script src="app.js"></script></body></html>'
}

function getHTML () {
  return '<!DOCTYPE html><html lang="en" dir="ltr"><head><title>budo</title><meta charset="utf-8"></head><body><script type="text/javascript" src="//localhost:35729/livereload.js?snipver=1" async="" defer=""></script><script src="app.js"></script></body></html>'
}

function getHTMLWithHost (ip) {
  return '<!DOCTYPE html><html lang="en" dir="ltr"><head><title>budo</title><meta charset="utf-8"></head><body><script type="text/javascript" src="//' + ip + ':35729/livereload.js?snipver=1" async="" defer=""></script><script src="app.js"></script></body></html>'
}
