var test = require('tape')
var budo = require('../')
var defaultHtml = require('simple-html-index')
var URL = require('url')

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

test('support defaultIndex stream', function (t) {
  t.plan(3)

  function html (opt) {
    return defaultHtml({
      entry: opt.entry,
      title: 'foobar',
      css: 'main.css'
    })
  }

  var app = budo(entry, { dir: __dirname, defaultIndex: html })
    .on('connect', function (ev) {
      request.get({
        uri: ev.uri
      }, function (err, resp, body) {
        if (err) t.fail(err)
        t.equal(resp.statusCode, 200)
        t.equal(body, '<!DOCTYPE html><html lang="en" dir="ltr"><head><title>foobar</title><meta charset="utf-8"><link rel="stylesheet" href="main.css"></head><body><script src="app.js"></script></body></html>')
        app.close()
      })
    })
    .on('exit', function () {
      t.ok(true, 'closed')
    })
    .on('error', t.fail.bind(t))
})

test('support --title and --css', function (t) {
  t.plan(3)

  var app = budo(entry, {
    dir: __dirname,
    title: 'foobar',
    css: 'main.css'
  })
    .on('connect', function (ev) {
      request.get({
        uri: ev.uri
      }, function (err, resp, body) {
        if (err) t.fail(err)
        t.equal(resp.statusCode, 200)
        t.equal(body, '<!DOCTYPE html><html lang="en" dir="ltr"><head><title>foobar</title><meta charset="utf-8"><link rel="stylesheet" href="main.css"></head><body><script src="app.js"></script></body></html>')
        app.close()
      })
    })
    .on('exit', function () {
      t.ok(true, 'closed')
    })
    .on('error', t.fail.bind(t))
})

test('favicon.ico should have status code 200', function (t) {
  t.plan(2)
  var app = budo(entry, { dir: __dirname })
    .on('connect', function (ev) {
      request.get({
        uri: ev.uri + 'favicon.ico'
      }, function (err, resp) {
        if (err) t.fail(err)
        t.equal(resp.statusCode, 200)
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

test('serve with CORS enable', function (t) {
  t.plan(2)
  var app = budo(entry, { dir: __dirname, cors: true })
    .on('connect', function (ev) {
      request.get({
        uri: ev.uri + 'favicon.ico'
      }, function (err, resp) {
        if (err) t.fail(err)
        t.equal(resp.headers['access-control-allow-origin'], '*')
        app.close()
      })
    })
    .on('exit', function () {
      t.ok(true, 'closed')
    })
    .on('error', t.fail.bind(t))
})

test('serve with SSL enable', function (t) {
  t.plan(3)
  var app = budo(entry, { dir: __dirname, ssl: true })
    .on('connect', function (ev) {
      t.equal(URL.parse(ev.uri).protocol, 'https:')
      request.get({
        rejectUnauthorized: false,
        uri: ev.uri + 'favicon.ico'
      }, function (err, resp) {
        if (err) {
          t.fail(err)
        }
        t.equal(resp.statusCode, 200)
        app.close()
      })
    })
    .on('exit', function () {
      t.ok(true, 'closed')
    })
    .on('error', t.fail.bind(t))
})
