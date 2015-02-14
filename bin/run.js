#!/usr/bin/env node
require('bole').output({
    stream: process.stdout,
    level: 'debug'
})

var minimist = require('minimist')
var portfinder = require('portfinder')
var watchify = require('../lib/watchify')
var http = require('../lib/server').http
var live = require('../lib/live')
var chrome = require('../lib/chrome-remote')
var tmpdir = require('../lib/tmpdir')
var path = require('path')
var xtend = require('xtend')
var log = require('bole')('mystc')
var Emitter = require('events/')

module.exports = function(baseArgs, opt) {
    opt = opt||{}
    
    var emitter = new Emitter()
    var watchifyArgs = baseArgs
    var argv = minimist(baseArgs)

    argv.path = argv.path || process.cwd()
    argv.port = argv.port || argv.p || 9966


    //once tmpdir is a bit more stable, we 
    //can start allowing no outfile args
    if (!argv.o && !argv.outfile)  {
        // console.error("Error: Must provide --outfile argument!")
        // process.exit(1)
    }

    portfinder.basePort = argv.port
    getOutput(function(err, output) {
        if (err) {
            console.error("Error: Could not create temp bundle.js directory")
            process.exit(1)
        }
        //patch watchify args with new outfile
        setOutfile(watchifyArgs, output.from)
        portfinder.getPort(start.bind(null, output))
    })

    return emitter

    //get an output directory, from user or tmp dir
    function getOutput(cb) {
        var output
        var outfile = argv.o || argv.outfile
        if (!outfile) {
            var to = 'bundle.js'
            tmpdir(function(err, filedir) {
                if (!err) {
                    var file = path.join(filedir, to)
                    output = { 
                        tmp: true, 
                        from: file, 
                        to: to, 
                        dir: filedir 
                    }
                }
                cb(err, output)
            })
        } else {
            var from = path.join(argv.path, outfile)
            output = { 
                from: from, 
                to: outfile, 
                dir: argv.path
            }
            cb(null, output)
        }
    }

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

                if (argv.live || argv.l || opt.chrome)
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
        var watchArgs = { poll: Boolean(output.tmp) }
        var reloader
        if (hot) {
            watchArgs = { ignoreReload: output.from }
            //Wait for chrome to boot up before 
            //starting debugger
            setTimeout(function() {
                reloader = chrome({ 
                    uri: uri 
                })
            }, 1000)
        }
        
        live(output.from, watchArgs)
            .on('watch', function(event, file) {
                if (reloader 
                      && file === output.from 
                      && (event === 'change' || event === 'add')) {
                    reloader(file)
                }
            })
    }
}