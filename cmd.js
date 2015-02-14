#!/usr/bin/env node
var watchifyArgs = process.argv.slice(2)
var argv = require('minimist')(watchifyArgs)
var portfinder = require('portfinder')
var watchify = require('./lib/watchify')
var http = require('./lib/server').http
var path = require('path')
var xtend = require('xtend')
var tmp = require('./lib/tmp')
var live = require('./lib/live')
var log = require('bole')('mystc')

require('bole').output({
    stream: process.stdout,
    level: 'debug'
})

argv.path = argv.path || process.cwd()
argv.port = argv.port || argv.p || 9966

var outfile = argv.o || argv.outfile
if (!outfile)  {
    console.error("Error: Must provide --outfile argument!")
    process.exit(1)
}

portfinder.basePort = argv.port
portfinder.getPort(function(err, port) {
    var from = path.join(argv.path, outfile)
    var output = { from: from, to: outfile }

    //patch watchify args with new outfile
    setOutfile(watchifyArgs, output.from)

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

            if (argv.live || argv.l)
                setupLive(uri, output.from)
        })
})

function setOutfile(args, file) {
    var idx = args.indexOf('-o')
    if (idx === -1)
        idx = args.indexOf('--outfile')
    args[idx+1] = file
}

function setupLive(uri, bundle) {
    var hot = argv.chrome
    var watchArgs
    var reloader
    if (hot) {
        watchArgs = { ignoreReload: '**/bundle.js' }
        reloader = require('./lib/chrome-remote')({ 
            uri: uri 
        })
    }
    
    live(bundle, watchArgs)
        .on('watch', function(event, file) {
            if (reloader 
                  && file === bundle 
                  && (event === 'change' || event === 'add')) {
                reloader(file)
            }
        })
}