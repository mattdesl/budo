#!/usr/bin/env node

//Starts up budo with some logging,
//also listens for live reload events

var args = process.argv.slice(2)
var opts = require('minimist')(args)
var portfinder = require('portfinder')

var entries = opts._
opts.stream = process.stdout
delete opts._

portfinder.basePort = opts.port || opts.p || 9966
portfinder.getPort(function(err, port) {
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
