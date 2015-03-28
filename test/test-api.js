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
  .on('connect', function(ev) {
    var file = path.join(__dirname, 'bundle.js')
    t.equal(ev.to, 'bundle.js', 'mapping matches')
    t.equal(ev.from, file, 'from matches')
    t.equal(ev.uri, 'http://localhost:8000/', 'uri matches')
    t.equal(ev.host, 'localhost', 'host is not specified')
    t.equal(ev.port, 8000, 'port matches')
    t.equal(ev.glob, file, 'glob matches file')
    t.equal(ev.dir, __dirname, 'dir matches')
    setTimeout(function() {
      ev.close()
      cleanup()
    }, 1000)
  })
  .on('exit', function() {
    t.ok(true, 'closing')
  })
})