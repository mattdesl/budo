#!/usr/bin/env node
require('bole').output({
    stream: process.stdout,
    level: 'debug'
})

var launch = require('chrome-launch')
var argv = require('minimist')(process.argv.slice(2))
var tmpDir = require('./lib/tmp')()

var port = argv.port || argv.p || 9222
var url = argv._[0] || ''
if (url && !(/^.*\:\/\//.test(url))) {
    url = 'http://'+url
}

var proc = launch(url, {
    dir: tmpDir,
    nuke: false,
    args: [
        '--remote-debugging-port='+port
    ]
})
proc.on('close', function() {
    proc.kill()
})