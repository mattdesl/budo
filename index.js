var minimist = require('minimist')
var spawn = require('npm-execspawn')
var path = require('path')
var xtend = require('xtend')

var server = require('./lib/server')

module.exports = function(watchifyArgs, opts) {
    var cmd = ['watchify'].concat(watchifyArgs).join(' ')
    var proc = spawn(cmd)
    var port = opts.port

    proc.stderr.on('data', function(data) {
        console.error(data.toString().trim())
    })

    return server.http(opts)
        .listen(port, listening)

    function listening(err) {
        if (err) {
            console.error('error starting server', err)
            process.exit(1)
        }
        console.error('server started at ' + 'http://localhost:' + port)
    }
}