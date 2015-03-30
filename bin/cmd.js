#!/usr/bin/env node

//Starts up budo with some logging,
//also listens for live reload events

var args = process.argv.slice(2)
var opts = require('minimist')(args)
var getport = require('getport')

var entries = opts._
opts.stream = process.stdout
delete opts._

var showHelp = opts.h || opts.help

if (!showHelp && (!entries || entries.filter(Boolean).length === 0)) {
    console.error('ERROR: no entry scripts specified\n  use --help for examples')
    return
}

if (showHelp) {
    var vers = require('../package.json').version
    console.log('budo '+vers, '\n')
    var help = require('path').join(__dirname, 'help.txt')
    require('fs').createReadStream(help)
        .pipe(process.stdout)
    return
}

var basePort = opts.port || opts.p || 9966
getport(basePort, function(err, port) {
    if (err) {
        console.error("Could not find port", err)
        process.exit(1)
    }
    opts.port = port
    require('../')(entries, opts)
        .on('error', function(err2) {
            console.error(err2.message)
            process.exit(1)
        })
})
