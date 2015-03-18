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
    
    //patch watchify args with new outfile and default debug
    setOutfile(watchifyArgs, output.from)
    setDebug(watchifyArgs, opt.d || opt.debug)
    
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

    //when watchify ends, close the server
    watchProc.stderr.on('end', function() {
        emitter.close()
    })
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

    //Supports various debug features
    //    ['--no-debug'] (from minimist parsing, which browserify uses)
    //    ['--debug=false']
    //    ['--debug', 'false']
    //    ['-d', 'false']
    //Need to remove the debug flag entirely from args otherwise browserify
    //will use source maps
    function setDebug(arglist, enabled) {
        enabled = enabled !== false && enabled !== 'false'
        
        //user can disable debug
        if (enabled === false) { 
            removeDebug(arglist)
        } 
        //by default, we want to enable debug
        else {
            var idx1 = arglist.indexOf('-d')
            var idx2 = arglist.indexOf('--debug')
            if (idx1 === -1 && idx2 === -1)
                arglist.push('-d')
        }
    }

    function removeDebug(arglist) {
        var args = ['-d', '--debug', '--debug=false']
        args.forEach(function(arg) {
            var idx = arglist.indexOf(arg)
            if (idx === -1 || String(arglist[idx+1]) === 'true')
                return
            if (String(arglist[idx+1]) === 'false')
                arglist.splice(idx, 2)
            else
                arglist.splice(idx, 1)
        })
    }
}