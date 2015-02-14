#!/usr/bin/env node
var launch = require('chrome-launch')
var baseArgs = process.argv.slice(2)
var argv = require('minimist')(baseArgs)
var createTmp = require('../lib/tmpdir')

var ready = argv.open ? openURI : function(){}

require('./run')(baseArgs, { chrome: true })
    .on('connect', ready)

function openURI(uri) {
    createTmp(function(err, dir) {
        var port = typeof argv.open === 'number' ? argv.open : 9222
        var proc = launch(uri, {
            dir: dir,
            nuke: false,
            args: [
                '--remote-debugging-port='+port
            ]
        })
        proc.on('close', function() {
            proc.kill()
        })
    })
}