#!/usr/bin/env node
require('bole').output({
    stream: process.stdout,
    level: 'debug'
})

var log = require('bole')('budo')
var minimist = require('minimist')
var portfinder = require('portfinder')
var path = require('path')
var xtend = require('xtend')
var Emitter = require('events/')

var getOutput = require('../lib/get-output')
var watchify = require('../lib/watchify')
var http = require('../lib/server').http
var live = require('../lib/live')
var chrome = require('../lib/chrome-remote')
var tmpdir = require('../lib/tmpdir')

module.exports = function(baseArgs, opt) {
    opt = opt||{}
    
    var emitter = new Emitter()
    var watchifyArgs = baseArgs
    var argv = minimist(baseArgs)

    if (argv._.length === 0) {
        console.error("No entry scripts specified!")
        process.exit(1)
    }

    argv.path = argv.path || process.cwd()
    argv.port = argv.port || 9966

    portfinder.basePort = argv.port
    getOutput(argv, function(err, output) {
        if (err) {
            console.error("Error: Could not create temp bundle.js directory")
            process.exit(1)
        }

        //patch watchify args with new outfile
        setOutfile(watchifyArgs, output.from)
        portfinder.getPort(start.bind(null, output))
    })

    return emitter

    function start(output, err, port) {
        watchify(watchifyArgs)
        var serverOpt = xtend(argv, { output: output })
        var server = http(serverOpt)
            .on('error', function(err) {
                if (err) {
                    console.error("Error:", err.message)
                    process.exit(1)
                }
            })
            .listen(port, function(err) {
                if (err) {
                    console.error("Could not connect to server:", err)
                    process.exit(1)
                }
                var uri = "http://localhost:"+port+"/"
                log.info("Server running at", uri)

                emitter.emit('connect', uri)

                if (argv.live || opt.chrome)
                    startLive(uri, output)
            })
    }

    function setOutfile(args, file) {
        var idx = args.indexOf('-o')
        if (idx === -1)
            idx = args.indexOf('--outfile')
        if (idx === -1) {
            args.push('-o')
            args.push(file)
        } else 
            args[idx+1] = file
    }

    function startLive(uri, output) {
        var hot = opt.chrome
        var watchArgs = {}
        var reloader
        if (hot) {
            watchArgs = xtend(watchArgs, { ignoreReload: output.from })

            var delay = argv.open ? 1000 : 0
            //Wait for chrome to boot up before 
            //starting debugger
            setTimeout(function() {
                reloader = chrome({ 
                    uri: uri 
                })
            }, delay)
        }

        //bug with chokidar@1.0.0-rc3
        //anything in OSX tmp dirs need a wildcard
        //to work with fsevents
        var glob = output.tmp 
            ? path.join(output.dir, '**.js')
            : output.from

        live(glob, watchArgs)
            .on('watch', function(event, file) {
                if (reloader 
                      && file === output.from 
                      && (event === 'change' || event === 'add')) {
                    reloader(file)
                }
            })
    }
}