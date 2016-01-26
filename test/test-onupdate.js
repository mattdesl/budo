var test = require('tape')
var path = require('path')
var kill = require('tree-kill')

var spawn = require('win-spawn')
var cli = path.resolve(__dirname, '..', 'bin', 'cmd.js')

test('should trigger echo', function (t) {
  t.plan(2)
  t.timeoutAfter(5000)
  var src = path.resolve(__dirname, 'fixtures', 'app.js')
  var proc = spawn(cli, [ src, '--onupdate', 'echo FOO BAR', '--no-stream' ])

  proc.stdout.on('data', function (buf) {
    t.equal(buf.toString().trim(), 'FOO BAR')
    proc.on('exit', function () {
      t.ok(true, 'closed')
    })
    kill(proc.pid)
  })
})
