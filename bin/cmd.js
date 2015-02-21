#!/usr/bin/env node

//Starts up budo with some logging,
//also listens for live reload events

require('bole').output({
    stream: process.stdout,
    level: 'debug'
})

var args = process.argv.slice(2)
var opts = require('minimist')(args)
var wtch = require('wtch')

var defaultGlob = '**/*.{html,css}'

require('../')(args, function(budo) {
    var watcher
    if (opts.live || opts['live-plugin']) {
        watcher = wtch([defaultGlob, budo.output.glob])
    }

    budo.on('exit', function() {
        if (watcher)
            watcher.close()
    })
})