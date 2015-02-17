var rimraf = require('rimraf')
var fs = require('fs')
var path = require('path')
var spawn = require('win-spawn')
var kill = require('tree-kill')

var ndjson = require('ndjson')
var test = require('tape')
var concat = require('concat-stream')

var cliPath = path.resolve(__dirname, '..', 'bin', 'cmd.js')

//Some other tests needed:
// --dir
// --live
// --live-plugin
// --serves proper JS bundle

test('should fail without scripts', function(t) {
    t.plan(1)
    var proc = spawn(cliPath)
    proc.stderr.pipe(concat(function(str) {
        t.equal(str.toString().trim(), 'No entry scripts specified!')
    }))
})


test('should run on 9966', function(t) {
    t.plan(1)
    var proc = spawn(cliPath, ['app.js', '-o', 'bundle.js'], { cwd: __dirname, env: process.env })
    var expected = 'Server running at http://localhost:9966/'

    proc.stdout.pipe(ndjson.parse())
        .on('data', function(data) {
            t.equal(data && data.message,
                expected, 'starts server')
            kill(proc.pid)
        })
        .on('error', function(err) {
            t.fail(err)
            kill(proc.pid)
        })
})

test('should create and destroy tmpdir', function(t) {
    t.plan(2)
    var proc = spawn(cliPath, ['app.js'], { cwd: __dirname, env: process.env })
    var expected = 'temp directory created at '
    proc.stdout.pipe(ndjson.parse())
        .on('data', function(data) {
            if (data.level !== 'debug')
                return

            var msg = data && data.message
            var idx = msg.indexOf(expected)
            
            if (idx === -1) {
                t.fail('no temp dir created')
                kill(proc.pid)
            } else {
                var path = msg.substring(idx+expected.length).trim()
                t.ok(true, 'created tmp dir')
                proc.on('exit', cleanup(path))
                kill(proc.pid, 'SIGINT')
            }
        })
        .on('error', function(err) {
            t.fail(err)
            kill(proc.pid)
        })

    function cleanup(path) {
        return function() {
            fs.exists(path, function(exists) {
                if (exists) {
                    t.fail('tmpdir not cleaned up '+path)
                    rimraf(path, function(err) {
                        if (err)
                            console.error(err)
                    })
                }
                else t.ok(true, 'tmpdir cleaned up')
            })
        }
    }
})