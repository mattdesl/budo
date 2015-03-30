var test = require('tape')
var budo = require('../')
var path = require('path')
var request = require('request')
var cleanup = require('./cleanup')
var fs = require('fs')
var source = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8')

test('should inject LiveReload snippet', function(t) {
  t.plan(4)
  t.timeoutAfter(10000)

  var server

  var entry = path.join(__dirname, 'app.js')
  budo(entry, {
    dir: __dirname,
    port: 8000,
    outfile: 'bundle.js',
    live: true
  })
  .on('error', function(err) {
    t.fail(err)
  })
  .on('watch', function(event, file) {
    t.equal(path.basename(file), 'bundle.js', 'watch event triggered')
  })
  .on('reload', function(file) {
    t.equal(path.basename(file), 'bundle.js', 'reload event triggered')
    cleanup()
    server.close()
  })
  .on('connect', function(ev) {
    server = ev
    matchesHTML(t, ev.uri)
    setTimeout(function() {
      fs.writeFile(entry, source)
    }, 1000)
  })
  .on('exit', function() {
    t.ok(true, 'closing')
  })
})

function matchesHTML(t, uri) {
  request.get({ uri: uri + 'index.html' }, function(err, resp, body) {
    if (err) t.fail(err)
    t.equal(body, getHTML(), 'matches expected HTML')
  })
}

function getHTML() {
  return '<!doctype html><head><meta charset="utf-8"></head><body><script type="text/javascript" src="http://localhost:35729/livereload.js?snipver=1"></script><script src="bundle.js"></script></body></html>'
}