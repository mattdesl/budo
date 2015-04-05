var test = require('tape')
var budo = require('../')
var cleanup = require('./cleanup')
var path = require('path')

// test('gets update() after connect', function(t) {
//   t.plan(8)
//   t.timeoutAfter(10000)

//   budo('test/app.js', {
//     dir: __dirname,
//     port: 8000
//   })
//   .on('error', function(err) {
//     t.fail(err)
//   })
//   .on('connect', function(app) {
//     var file = path.join(__dirname, 'bundle.js')
//     t.equal(app.to, 'bundle.js', 'mapping matches')
//     t.equal(app.from, file, 'from matches')
//     t.equal(app.uri, 'http://localhost:8000/', 'uri matches')
//     t.equal(app.host, 'localhost', 'host is not specified')
//     t.equal(app.port, 8000, 'port matches')
//     t.equal(app.dir, __dirname, 'dir matches')

//     app
//       .once('update', function(type) {
//         t.ok(true, 'got bundle.js update')
//         app.close()
//         cleanup()
//       })
//   })
//   .on('reload', function() {
//     t.fail('should not have received reload event')
//   })
//   .on('exit', function() {
//     t.ok(true, 'closing')
//   })
// })

test('sets live() with args before connect', function(t) {
  t.plan(4)
  t.timeoutAfter(10000)

  var app = budo('test/app.js', {
    dir: __dirname,
    port: 8000,
    outfile: 'bundle.js'
  })
    //manually enable LiveReload server
    .live() 
    //manually trigger LiveReload event on bundle.js update
    .on('update', function() {
      t.ok('got live reload event')
      app.reload()
    })
  testLive(t, app)
})

test('sets watch() and live() by default with live: true', function(t) {
  t.plan(3)
  t.timeoutAfter(10000)

  var app = budo('test/app.js', {
    dir: __dirname,
    port: 8000,
    live: true
  })
  testLive(t, app)
})

function testLive(t, app) {
  app
    .once('update', function() { //bundle.js changed
      t.ok(true, 'got update event')
    })
    .once('reload', function(err) { //LiveReload triggered
      t.ok(true, 'got reload event')
      app.close()
      cleanup()
    })
    .on('error', function(err) {
      t.fail(err)
    })
    .on('exit', function() {
      t.ok(true, 'closing')
    })
}