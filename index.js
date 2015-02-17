var log = require('bole')('budo')
var minimist = require('minimist')
var portfinder = require('portfinder')
var xtend = require('xtend')
var assign = require('xtend/mutable')

var getOutput = require('./lib/get-output')

var budo = require('./lib/budo')
var noop = function(){}

module.exports = function(args, cb) {
    cb = cb||noop

    var argv = minimist(args)
    if (argv._.length === 0) {
        console.error("No entry scripts specified!")
        process.exit(1)
    }

    argv.dir = argv.dir || process.cwd()
    getOutput(argv, function(err, output) {
        if (err) {
            console.error("Error: Could not create temp bundle.js directory")
            process.exit(1)
        }
        //determine next port    
        portfinder.basePort = argv.port
        portfinder.getPort(function(err, port) {
            if (err) {
                console.error("Error: Could not get available port")
                process.exit(1)
            }

            //run watchify server
            var emitter = budo(args, xtend(argv, { 
                port: port,
                output: output
            })).on('error', function(err) {
                console.error("Error running budo:", err)
                process.exit(1)
            }).on('exit', function() {
                log.info('closing')
            })

            emitter.on('connect', function(result) {
                cb(result)
            })
        })
    })
}