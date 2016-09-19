var budo = require('../')
var test = require('tape')
var ndjson = require('ndjson')
var request = require('request')
var path = require('path')
var entryMap = require('../lib/map-entry')

// an HTML page with no <script> entry
var defaultIndex = '<!DOCTYPE html><html lang="en" dir="ltr"><head><title>budo</title><meta charset="utf-8"></head><body></body></html>'
var scriptIndex = '<!DOCTYPE html><html lang="en" dir="ltr"><head><title>budo</title><meta charset="utf-8"></head><body><script src="foo.js"></script></body></html>'

test('accept "." entry point', function (t) {
  // currently we can't test budo('.') because the index.js
  // is node-specific, and crashes the build.
  // when { cwd } option is supported, we could change this to
  // a fixture folder
  t.plan(2)
  t.deepEqual(entryMap('.'), {
    from: path.resolve(__dirname, '..', 'index.js'),
    url: 'index.js'
  })
  t.deepEqual(entryMap('.:bundle.js'), {
    from: path.resolve(__dirname, '..', 'index.js'),
    url: 'bundle.js'
  })
})

test('no arguments needed', function (t) {
  t.plan(4)
  var b = budo()
    .on('connect', function (ev) {
      t.deepEqual(ev.entries, [])
      t.deepEqual(ev.serve, undefined)
      request.get({ url: ev.uri }, function (err, resp, body) {
        if (err) return t.fail(err)
        t.equal(resp.statusCode, 200, 'still gets generated index.html')
        t.equal(body, defaultIndex, 'should match default index')
        b.close()
      })
    })
})

test('still supports serve', function (t) {
  t.plan(4)
  var b = budo({
    serve: 'foo.js'
  })
    .on('connect', function (ev) {
      t.deepEqual(ev.entries, [])
      t.deepEqual(ev.serve, 'foo.js')
      request.get({ url: ev.uri }, function (err, resp, body) {
        if (err) return t.fail(err)
        t.equal(resp.statusCode, 200, 'still gets generated index.html')
        t.equal(body, scriptIndex)
        b.close()
      })
    })
})

test('user can build their own server', function (t) {
  t.plan(5)
  var stream = ndjson.parse()
  stream.on('data', function (data) {
    if (data.url === '/foo.js') {
      t.equal(data.type, 'middleware', 'got middleware')
    }
  })

  var b = budo({
    serve: 'foo.js',
    stream: stream,
    ndjson: true,
    middleware: function (req, res, next) {
      if (req.url === '/foo.js') {
        res.end('hello world')
      } else {
        next()
      }
    }
  })
    .on('connect', function (ev) {
      t.deepEqual(ev.entries, [])
      t.deepEqual(ev.serve, 'foo.js')
      request.get({ url: ev.uri + 'foo.js' }, function (err, resp, body) {
        if (err) return t.fail(err)
        t.equal(resp.statusCode, 200, 'gets foo.js route')
        t.equal(body, 'hello world')
        b.close()
      })
    })
})
