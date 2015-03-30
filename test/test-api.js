var test = require('tape')
var budo = require('../')
var cleanup = require('./cleanup')
var path = require('path')

test('sets watch() after connect', function(t) {
  t.plan(9)
  t.timeoutAfter(10000)

  budo('test/app.js', {
    dir: __dirname,
    port: 8000,
    outfile: 'bundle.js'
  })
  .on('error', function(err) {
    t.fail(err)
  })
  .on('connect', function(app) {
    var file = path.join(__dirname, 'bundle.js')
    t.equal(app.to, 'bundle.js', 'mapping matches')
    t.equal(app.from, file, 'from matches')
    t.equal(app.uri, 'http://localhost:8000/', 'uri matches')
    t.equal(app.host, 'localhost', 'host is not specified')
    t.equal(app.port, 8000, 'port matches')
    t.equal(app.glob, file, 'glob matches file')
    t.equal(app.dir, __dirname, 'dir matches')

    app
      .watch()
      .once('watch', function(type) {
        t.ok(true, 'got watch')
        app.close()
        cleanup()
      })
  })
  .on('reload', function() {
    t.fail('should not have received reload event')
  })
  .on('exit', function() {
    t.ok(true, 'closing')
  })
})

test('sets watch() with args before connect', function(t) {
  t.plan(3)
  t.timeoutAfter(10000)

  var app = budo('test/app.js', {
    dir: __dirname,
    port: 8000,
    outfile: 'bundle.js'
  })
  .watch() //enable watcher
  .once('watch', function() {
    t.ok(true, 'got watch')
    app.close()
    cleanup()
  })
  .on('error', function(err) {
    t.fail(err)
  })
  .on('reload', function() {
    t.fail('should not have received reload event')
  })
  .on('connect', function(app) {
    var file = path.join(__dirname, 'bundle.js')
    t.equal(app.from, file, 'from matches')
  })
  .on('exit', function() {
    t.ok(true, 'closing')
  })
})

test('sets watch() and live() by default with live: true', function(t) {
  t.plan(4)
  t.timeoutAfter(10000)

  var app = budo('test/app.js', {
    dir: __dirname,
    port: 8000,
    live: true,
    outfile: 'bundle.js'
  })
  .once('reload', function(err) {
    t.ok(true, 'got reload event')
    app.close()
    cleanup()
  })
  .once('watch', function() {
    t.ok(true, 'got watch event')    
  })
  .on('error', function(err) {
    t.fail(err)
  })
  .on('connect', function(app) {
    var file = path.join(__dirname, 'bundle.js')
    t.equal(app.from, file, 'from matches')
  })
  .on('exit', function() {
    t.ok(true, 'closing')
  })
})