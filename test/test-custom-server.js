var test = require('tape')
var budo = require('../')
var path = require('path')
var request = require('request')

var file = path.join(__dirname, 'fixtures', 'app.js')

test('custom middleware', function (t) {
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

test('stacking middlewares', function (t) {
  t.plan(2)
  var b = budo(file, {
    middleware: [
      function (req, res, next) {
        t.equal(req.url, '/api')
        next()
      },
      function (req, res, next) {
        if (req.url === '/api') {
          res.end('api contents')
        } else {
          next()
        }
      }
    ],
    serve: 'bundle.js'
  }).on('connect', function (ev) {
    request.get({ uri: ev.uri + 'api' }, function (err, resp, body) {
      b.close()
      if (err) return t.fail(err)
      t.equal(body, 'api contents')
    })
  })
})
