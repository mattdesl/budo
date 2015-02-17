var path = require('path')
var Emitter = require('events/')
var watchify = require('./watchify')
var minimist = require('minimist')
var xtend = require('xtend')
var assign = require('xtend/mutable')
var http = require('./server').http
var log = require('bole')('budo')

module.exports = function(watchifyArgs, opt) {
    var output = opt.output
    var port = opt.port || 9966
    var host = opt.host

    var emitter = new Emitter()

    //patch watchify args with new outfile
    setOutfile(watchifyArgs, output.from)
    //spin up watchify instance
    var watchProc = watchify(watchifyArgs)
    
    var serverOpt = xtend(opt, { output: output })
    var server = http(serverOpt)
        .on('error', function(err) {
            emitter.emit('error', err)
        })
        .listen(port, host, function(err) {
            if (err) {
                emitter.emit('error', new Error("Could not connect to server:", err))
                return 
            }
            var uri = "http://"+(host||'localhost')+":"+port+"/"
            log.info("Server running at", uri)

            //bug with chokidar@1.0.0-rc3
            //anything in OSX tmp dirs need a wildcard
            //to work with fsevents
            var glob = output.tmp 
                ? path.join(output.dir, '**.js')
                : output.from

            //add the uri / output to budo instance
            assign(emitter, {
                uri: uri,
                output: xtend(output, { glob: glob })
            })
            emitter.emit('connect', emitter)
        })

    emitter.close = function() {
        watchProc.kill()
        server.close()
        emitter.emit('exit')
    }

    return emitter

    function setOutfile(arglist, file) {
        var idx = arglist.indexOf('-o')
        if (idx === -1)
            idx = arglist.indexOf('--outfile')
        if (idx === -1) {
            arglist.push('-o')
            arglist.push(file)
        } else 
            arglist[idx+1] = file
    }
}