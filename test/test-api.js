var test = require('tape')
var budo = require('../')
var cleanup = require('./cleanup')
var path = require('path')

test('should provide an API', function(t) {
  t.plan(8)

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
      .watch(app.glob)
      .once('watch', function(type) {
        app.close()
        cleanup()
      })
  })
  .on('exit', function() {
    t.ok(true, 'closing')
  })
})