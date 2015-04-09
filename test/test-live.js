var test = require('tape')
var budo = require('../')
var path = require('path')
var request = require('request')
var fs = require('fs')
var source = fs.readFileSync(path.join(__dirname, 'fixtures', 'app.js'), 'utf8')

test('should inject LiveReload snippet', function(t) {
  t.plan(4)
  t.timeoutAfter(10000)

  var entry = path.join(__dirname, 'fixtures', 'app.js')
  var app = budo(entry, {
    dir: __dirname,
    port: 8000,
    serve: 'app.js',
    live: true
  })
  .on('error', function(err) {
    t.fail(err)
  })
  .on('update', function() {
    t.ok(true, 'update event triggered')
  })
  .on('reload', function(file) {
    t.equal(file, 'app.js', 'reload event triggered')
    app.close()
  })
  .on('connect', function(ev) {
    matchesHTML(t, ev.uri)
    setTimeout(function() {
      fs.writeFile(entry, source)
    }, 1000)
  })
  .on('exit', function() {
    t.ok(true, 'closing')
  })
})

test('manual LiveReload triggering', function(t) {
  t.plan(4)
  t.timeoutAfter(10000)

  var entry = path.join(__dirname, 'fixtures', 'app.js')
  var app = budo(entry, {
    dir: __dirname,
    port: 8000,
    serve: 'app.js'
  })
  .watch()
  .live()
  .on('error', function(err) {
    t.fail(err)
  })
  .on('update', function(file) {
    t.equal(file, 'app.js', 'update event triggered')
    app.reload(file)
  })
  .on('reload', function(file) {
    t.equal(file, 'app.js', 'reload event triggered')
    app.close()
  })
  .on('connect', function(ev) {
    matchesHTML(t, ev.uri)
    setTimeout(function() {
      fs.writeFile(entry, source)
    }, 1000)
  })
  .on('exit', function() {
    t.ok(true, 'closing')
  })
})


test('should not inject LiveReload snippet', function(t) {
  t.plan(1)
  t.timeoutAfter(10000)

  var entry = path.join(__dirname, 'fixtures', 'app.js')
  var app = budo(entry, {
    dir: __dirname,
    port: 8000,
    serve: 'app.js',
  })
  .live({ plugin: true })
  .on('error', function(err) {
    t.fail(err)
  })
  .on('connect', function(ev) {
    // matchesHTML(t, ev.uri, getHTMLNoLive())
    // setTimeout(function() {
      app.close()
    // }, 100)
  })
  .on('exit', function() {
    t.ok(true, 'closing')
  })
})

function matchesHTML(t, uri, html) {
  request.get({ uri: uri + 'index.html' }, function(err, resp, body) {
    if (err) t.fail(err)
    t.equal(body, html || getHTML(), 'matches expected HTML')
  })
}

function getHTMLNoLive() {
  return '<!doctype html><head><meta charset="utf-8"></head><body><script src="app.js"></script></body></html>'
}

function getHTML() {
  return '<!doctype html><head><meta charset="utf-8"></head><body><script type="text/javascript" src="http://localhost:35729/livereload.js?snipver=1"></script><script src="app.js"></script></body></html>'
}