var test = require('tape')
var budo = require('../')
var browserify = require('browserify')
var watchifyArgs = require('watchify').args
var path = require('path')
var brfs = require('brfs')
var xtend = require('xtend')

var entry = 'test/fixtures/app-brfs.js'

test('API supports camelCase and transform objects', function(t) {
  t.plan(1)
  t.timeoutAfter(10000)

  var bundler = browserify(xtend(watchifyArgs, {
    debug: false,
    transform: brfs,
    fullPaths: false,
    insertGlobals: true
  }))
  bundler.add(path.resolve(entry))

  bundler.bundle(function(err, expected) {
    if (err) return t.fail(err)

    var app = budo(entry, {
      transform: brfs,
      debug: false,
      fullPaths: false,
      insertGlobals: true
    }).once('update', function(name, src) {
      t.equal(src.toString(), expected.toString(), 'matches bundler')
      app.close()
    })
  })
})