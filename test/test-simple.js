var rimraf = require('rimraf')
var fs = require('fs')
var path = require('path')
var spawn = require('win-spawn')
var npmSpawn = require('npm-execspawn')
var kill = require('tree-kill')

var ndjson = require('ndjson')
var test = require('tape')
var concat = require('concat-stream')
var request = require('request')

var cliPath = path.resolve(__dirname, '..', 'bin', 'cmd.js')

//Some other tests needed:
// --live
// --live-plugin

test('should fail without scripts', function(t) {
    t.plan(1)
    var proc = spawn(cliPath)
    proc.stderr.pipe(concat(function(str) {
        t.equal(str.toString().trim(), 'No entry scripts specified!')
    }))
})

test('should run on available port', function(t) {
    t.plan(1)
    var proc = spawn(cliPath, ['app.js', '-o', 'bundle.js'], { cwd: __dirname, env: process.env })
    var expected = 'Server running at'

    proc.stdout.pipe(ndjson.parse())
        .on('data', function(data) {
            var msg = (data && data.message)||''
            t.ok(msg.indexOf(expected)>=0, 'starts server')
            kill(proc.pid)
        })
        .on('error', function(err) {
            t.fail(err)
            kill(proc.pid)
        })
})

test('should get a bundle.js', function(t) {
    var cwd = path.resolve(__dirname, '..')
    runBundleMatch(t, { 
        watchify: ['app.js', '-v', '-o', 'bundle-expected.js'],
        budo: ['app.js'],
    })
})

test('entry mapping to bundle2.js', function(t) {
    var cwd = path.resolve(__dirname, '..')
    runBundleMatch(t, { 
        watchify: ['app', '-v', '-o', 'bundle-expected.js'],
        budo: ['app:bundle2.js'],
        to: 'bundle2.js'
    })
})

test('should get a bundle.js with --outfile', function(t) {
    var cwd = path.resolve(__dirname, '..')
    runBundleMatch(t, { 
        watchify: ['app.js', '-v', '-o', 'bundle-expected.js'],
        budo: ['app.js', '-o', 'bundle.js']
    })
})

test('should get a bundle.js with --dir', function(t) {
    var cwd = path.resolve(__dirname, '..')
    runBundleMatch(t, { 
        cwd: cwd,
        watchify: ['test/app.js', '-v', '-o', 'test/bundle-expected.js'],
        budo: ['test/app.js', '-o', 'bundle.js', '--dir', 'test']
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

function runBundleMatch(t, opt) {
    opt = opt||{}

    t.plan(1)
    t.timeoutAfter(10000)
    var cwd = opt.cwd || __dirname
    var foundMsg = false
    var bundle = path.join(__dirname, 'bundle.js')
    var outputFile = 'bundle-expected.js'
    var bundleExpected = path.join(__dirname, outputFile)
    
    //the expected bundle
    var watchifyProc = npmSpawn('watchify '+ opt.watchify.join(' '), { cwd: cwd, env: process.env })
    watchifyProc.stderr.on('data',watchifyDone)
    watchifyProc.stdout.on('data',watchifyDone)

    function watchifyDone(msg) {
        var suc = msg.toString().indexOf(outputFile)
        if (suc === -1)
            t.fail('watchify process gave unexpected stdout/stderr message' )
        kill(watchifyProc.pid)

        var expected = fs.readFile(bundleExpected, 'utf8', function(err, data) {
            if (err)
                t.fail(err)
            budoMatches(data)
        })
    }

    function budoMatches(source) {
        var proc = spawn(cliPath, opt.budo, { cwd: cwd, env: process.env })
        proc.on('exit', cleanup)
        proc.stdout.pipe(ndjson.parse())
            .on('data', function(data) {
                var msg = (data.message||'').toLowerCase()
                if (msg.indexOf('temp directory created') >= 0)
                    return

                var running = 'server running at '
                var idx = msg.indexOf(running)
                if (idx >= 0) {
                    foundMsg = true
                    setTimeout(function() { //let bundling finish
                        var serverUrl = msg.substring(idx+running.length)
                        request.get({
                            uri: serverUrl + (opt.to || 'bundle.js')
                        }, function(err, resp, data) {
                            t.equal(data, source, 'bundle matches')
                            kill(proc.pid)
                        })
                    }, 1000)
                } else if (!foundMsg) {
                    t.fail('no server running message in '+ msg)
                    kill(proc.pid)
                }
            })
    }

    function cleanup() {
        rimraf(bundleExpected, function(err) {
            if (err) console.error(err)
        })
        rimraf(bundle, function(err) {
            if (err) console.error(err)
        })
    }
}
