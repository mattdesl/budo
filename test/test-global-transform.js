var test = require('tape')
var budo = require('../')
var through = require('through2')
var path = require('path')

test('allows global transform', function(t) {
  t.plan(4)
  t.timeoutAfter(10000)

  var app = budo('test/fixtures/app.js', {
    dir: __dirname,
    globalTransform: function(file) {
      t.equal(path.basename(file), 'app.js', 'got file in transform')
      return through()
    }
  })
    .on('update', function() {
      t.ok(true, 'got update')
      app.close()
    })
    .once('connect', function() {
      t.ok(true, 'connected')
    })
    .on('exit', function() {
      t.ok(true, 'got exit')
    })
})
