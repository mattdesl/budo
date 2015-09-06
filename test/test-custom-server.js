var test = require('tape')
var budo = require('../')
var path = require('path')
var request = require('request')

var file = path.join(__dirname, 'fixtures', 'app.js')

test('custom middleware with next()', function (t) {
  t.plan(1)
  var b = budo(file, {
    middleware: middleware
  }).on('connect', function (ev) {
    request.get({ uri: ev.uri + 'api' }, function (err, resp, body) {
      b.close()
      if (err) return t.fail(err)
      t.equal(body, 'hello world', 'gets custom middleware')
    })
  })

  function middleware (req, res, next) {
    if (req.url === '/api') {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain')
      res.end('hello world')
    } else {
      next()
    }
  }
})

test('custom middleware without next()', function (t) {
  t.plan(3)
  var b = budo(file, {
    middleware: middleware,
    serve: 'bundle.js'
  }).on('connect', function (ev) {
    request.get({ uri: ev.uri + 'bundle.js' }, function (err, resp, body) {
      b.close()
      if (err) return t.fail(err)
      t.equal(resp.statusCode, 200, 'status code 200')
      t.equal(resp.headers['content-type'], 'application/javascript; charset=utf-8', 'gets bundle.js')
    })
  })

  function middleware (req) {
    t.equal(req.url, '/bundle.js', 'middleware reached')
  }
})
