var test = require('tape')
var budo = require('../')
var request = require('request')
var slashes = require('connect-slashes')

test('should serve a file even if it looks like a dir', function (t) {
  t.plan(2)
  var app = budo({
    dir: __dirname
  }).on('connect', function (ev) {
    request.get({
      uri: ev.uri + 'fixtures/static-test-no-ext'
    }, function (err, resp, body) {
      if (err) t.fail(err)
      t.equal(body.toString(), 'hello', 'gets exact file with no extension')
      app.close()
    })
  })
  .on('exit', function () {
    t.ok(true, 'closed')
  })
  .on('error', t.fail.bind(t))
})

test('should serve /index.html when a directory is given', function (t) {
  var expected = '<!DOCTYPE html><html lang="en" dir="ltr"><head><meta charset="UTF-8"><title>static-test-in-folder</title></head><body></body></html>'
  t.plan(3)
  var app = budo({
    dir: __dirname
  }).on('connect', function (ev) {
    request.get({
      uri: ev.uri + 'fixtures/static-test'
    }, function (err, resp, body) {
      if (err) return t.fail(err)
      t.equal(body.toString(), expected, 'static-test looks for static-test/index.html')
      request.get({
        uri: ev.uri + 'fixtures/static-test/'
      }, function (err, resp, body) {
        if (err) return t.fail(err)
        t.equal(body.toString(), expected, 'static-test/ looks for static-test/index.html')
        app.close()
      })
    })
  })
  .on('exit', function () {
    t.ok(true, 'closed')
  })
  .on('error', t.fail.bind(t))
})

test('allow static-test/ to open static-test.html', function (t) {
  var expected = '<!DOCTYPE html><html lang="en" dir="ltr"><head><meta charset="UTF-8"><title>static-test</title></head><body></body></html>'
  t.plan(3)
  var app = budo({
    dir: __dirname,
    staticOptions: {
      index: false,
      extensions: [ 'html' ]
    },
    middleware: slashes(false) // strip trailing slashes
  }).on('connect', function (ev) {
    request.get({
      uri: ev.uri + 'fixtures/static-test-extension'
    }, function (err, resp, body) {
      if (err) return t.fail(err)
      t.equal(body.toString(), expected, 'static-test looks for static-test.html')
      request.get({
        uri: ev.uri + 'fixtures/static-test-extension/'
      }, function (err, resp, body) {
        if (err) return t.fail(err)
        t.equal(body.toString(), expected, 'static-test/ looks for static-test.html')
        app.close()
      })
    })
  })
  .on('exit', function () {
    t.ok(true, 'closed')
  })
  .on('error', t.fail.bind(t))
})
