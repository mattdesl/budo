var test = require('tape')
var budo = require('../')
var browserify = require('browserify')
var watchifyArgs = require('watchify').args
var path = require('path')
var brfs = require('brfs')
var xtend = require('xtend')

var entry = 'test/fixtures/app-brfs.js'
var spawn = require('win-spawn')

var basedir = path.resolve(__dirname, '..')
var cliPath = path.resolve(basedir, 'bin', 'cmd.js')
var request = require('request')
var kill = require('tree-kill')

test('CLI allows full stop for subarg', function(t) {
  t.plan(1)
  t.timeoutAfter(10000)
  runCLI(t, ['-v', '--no-debug', '--', '-t', '[', 'brfs', '--debug', ']', '--insert-globals'])
})

test('CLI still works without full stop and no subargs', function(t) {
  t.plan(1)
  t.timeoutAfter(10000)
  runCLI(t, ['-v', '--no-debug', '-t', 'brfs', '--insert-globals'])
})

test('API supports camelCase and transform objects', function(t) {
  t.plan(1)
  t.timeoutAfter(10000)

  doBundle(function(err, expected) {
    if (err) return t.fail(err)
    var app = budo(entry, {
      transform: brfs,
      debug: false,
      fullPaths: false,
      insertGlobals: true
    }).once('update', function(name, src) {
      t.equal(src.toString(), expected.toString(), 'matches bundler')
      app.close()
    })
  })
})


function doBundle(cb) {
  var bundler = browserify(xtend(watchifyArgs, {
    debug: false,
    transform: brfs,
    fullPaths: false,
    insertGlobals: true
  }))
  bundler.add(path.resolve(entry))
  bundler.bundle(cb)
}


function runCLI(t, cliArgs) {
  doBundle(function(err, expected) {
    if (err) return t.fail(err)

    var args = [entry].concat(cliArgs)

    var uri = 'http://localhost:9966/'
    var proc = spawn(cliPath, args, { cwd: basedir, env: process.env })
    proc.stderr.on('data', bail)
    proc.stdout.on('data', function(data) {
      try { data = JSON.parse(data) }
      catch (e) {}
      //get correct port
      if (data && data.message) {
        var msg = 'server running at '
        var idx = data.message.toLowerCase().indexOf(msg)
        if (idx >= 0) {
          uri = data.message.slice(idx+msg.length)
        }
      }
      //bundle ready
      else if (data && data.type === 'bundle') {
        request.get({ uri: uri + entry }, function(err, res, body) {
          if (err) return bail(err)
          t.equal(body.toString(), expected.toString(), 'bundles match')
          kill(proc.pid)
        })
      }
    })

    function bail(err) {
      proc.on('exit', function() {
        t.fail(err)
      })
      kill(proc.pid)
    }
  })
} 