var test = require('tape')
var budo = require('../')
var browserify = require('browserify')
var path = require('path')
var brfs = require('brfs')
const sucrasify = require('../lib/sucrasify')

var entry = 'test/fixtures/app-brfs.js'

test('CLI supports browserify args after full stop', function (t) {
  t.plan(1)
  t.timeoutAfter(10000)

  doBundle(function (err, expected) {
    if (err) return t.fail(err)
    var app = budo.cli([ entry, '--no-stream', '--no-debug', '--', '-t', 'brfs', '--insert-globals' ])
      .once('update', function (contents) {
        t.equal(contents.toString().length, expected.toString().length, 'matches bundler')
        app.close()
      })
  })
})

test('API supports browserify JS object', function (t) {
  t.plan(1)
  t.timeoutAfter(10000)

  doBundle(function (err, expected) {
    if (err) return t.fail(err)
    var app = budo(entry, {
      debug: false,
      browserify: {
        transform: brfs,
        fullPaths: false,
        insertGlobals: true
      }
    }).once('update', function (contents) {
      t.equal(contents.toString().length, expected.toString().length, 'matches bundler')
      app.close()
    })
  })
})

function doBundle (cb) {
  var bundler = browserify({
    debug: false,
    transform: brfs,
    fullPaths: false,
    insertGlobals: true
  })
  bundler.add(path.resolve(entry))
  bundler.transform(sucrasify)
  bundler.bundle(cb)
}
