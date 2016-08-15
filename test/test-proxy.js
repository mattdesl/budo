var test = require('tape')
var budo = require('../')
var path = require('path')
var request = require('request')
var http = require('http')

test('connect to proxy server api', function (t) {
  t.plan(6)
  t.timeoutAfter(20000)

  var server = http.createServer(function (req, res) {
    // console.log('url: %s', req.url)
    t.equal(req.url, '/api/hello')
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.write(JSON.stringify({ message: 'hello world' }))
    res.end()
  })

  server.on('close', function () {
    t.ok(true, 'closing proxy server')
  })

  server.listen(3000, function () {
    var entry = path.join(__dirname, 'fixtures', 'app.js')
    var app = budo(entry, {
      dir: __dirname,
      port: 8000,
      host: 'localhost',
      serve: 'app.js',
      proxy: '/api@http://localhost:3000/api'
    })
      .on('error', function (err) {
        t.fail(err)
      })
      .on('connect', function (ev) {
        setTimeout(function () {
          request('http://localhost:8000/api/hello', function (error, response, body) {
            if (error) t.fail(error)
            t.ok(!error, 'no proxy error')
            t.ok(body, 'received proxy response body')
            var json = JSON.parse(body)
            t.equal(json.message, 'hello world')
            app.close()
            server.close()
          })
        }, 1000)
      })
      .on('exit', function () {
        t.ok(true, 'closing')
      })
  })
})
