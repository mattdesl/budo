var path = require('path')
var Emitter = require('events/')
var watchify = require('./watchify')
var xtend = require('xtend')
var assign = require('xtend/mutable')
var http = require('./server').http
var log = require('bole')('budo')
var dargs = require('dargs')

module.exports = function(entries, output, opt) {
    opt = opt||{}

    var port = opt.port || 9966
    var host = opt.host
    var serverOpt = xtend(opt, { output: output })
    
    var emitter = new Emitter()
    var closed = false

    //spin up watchify instance
    var watchifyArgs = getWatchifyArgs(entries, output, opt)
    var watchProc = watchify(watchifyArgs)
    
    var server = http(serverOpt)
        .on('error', function(err) {
            emitter.emit('error', err)
        })
        .listen(port, host, handler)
        
    emitter.close = function() {
        if (closed) return
        closed = true
        watchProc.kill()
        server.close()
        emitter.emit('exit')
    }

    //when watchify ends, close the server
    watchProc.stderr.on('end', function() {
        emitter.close()
    })
    return emitter

    function handler(err) {
        if (err) {
            emitter.emit('error', new Error("Could not connect to server: " + err))
            return 
        }
        var hostname = (host||'localhost')
        var uri = "http://"+hostname+":"+port+"/"
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
            port: port,
            host: hostname,
            server: server
        }, output, { glob: glob })
        emitter.emit('connect', emitter)
    }
}

function getWatchifyArgs(entries, output, opt) {
    //do not mutate original opts
    opt = assign({}, opt)

    //set output file
    opt.outfile = output.from
    delete opt.o

    //enable debug by default
    if (opt.d !== false && opt.debug !== false) {
        delete opt.d
        opt.debug = true
    } 
    //if user explicitly disabled debug...
    else if (opt.d === false || opt.debug === false) {
        delete opt.d
        delete opt.debug
    }

    //clean up some possible collisions
    delete opt.dir
    delete opt.port
    delete opt.host
    delete opt.live
    delete opt['live-port']
    delete opt['live-script']
    delete opt['live-plugin']
    return entries.concat(dargs(opt))
}