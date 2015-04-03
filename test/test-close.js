var test = require('tape')
var budo = require('../')
var spawn = require('win-spawn')
var fs = require('fs')
var path = require('path')
var cleanup = require('./cleanup')
var ndjson = require('ndjson')
var kill = require('tree-kill')

var cliPath = path.resolve(__dirname, '..', 'bin', 'cmd.js')

test('should close budo API and delete tmp dirs', function(t) {
  t.plan(3)
  t.timeoutAfter(5000)

  var tmpFile 

  var app = budo('test/app.js', {
    dir: __dirname,
    port: 8000,
  })
  .on('connect', function(ev) {
    tmpFile = ev.from
    t.ok(true, 'connected')
    setTimeout(function() {
      app.close()
    }, 1000)
  })
  .on('exit', function() {
    t.ok(true, 'exiting')
    doesNotExist(t, tmpFile)
  })
  .on('error', function(err) {
    t.fail(err)
  })
})

test('should close budo CLI and delete tmp dirs', function(t) {
  t.plan(2)
  var timeout = 2000
  t.timeoutAfter(timeout)
  var tmpDir

  var proc = spawn(cliPath, ['app.js'], {
    cwd: __dirname,
    env: process.env
  })
  proc.stdout.pipe(ndjson.parse())
    .on('data', function(data) {
      if (!data || !data.message)
        return

      var msg = 'temp directory created at'
      var idx = data.message.indexOf(msg)
      
      if (idx === -1)
        return

      tmpDir = data.message.substring(idx).trim()
      proc.on('exit', function() {
        t.ok(true, 'got exit event')
        doesNotExist(t, tmpDir)
      })
      kill(proc.pid)
    })
  proc.stderr.pipe(process.stderr)
})

function doesNotExist(t, file) {
  setTimeout(function() {
    fs.stat(file, function(err) {
      if (err)
        t.ok(true, 'tmpfile removed')
      else
        t.fail('tmpfile was not destroyed')
    })
  }, 500)
}