var path = require('path')
var Emitter = require('events/')
var watchify = require('./watchify')
var xtend = require('xtend')
var assign = require('xtend/mutable')
var http = require('./server').http
var log = require('bole')('budo')
var dargs = require('dargs')
var createFileWatch = require('./file-watch')
var createTinylr = require('./tinylr')

module.exports = function(entries, output, opt) {
    opt = opt||{}

    var port = opt.port || 9966
    var host = opt.host
    var serverOpt = xtend(opt, { output: output })
    
    var emitter = new Emitter()
    var closed = false

    //spin up watchify instance
    var watchifyArgs = getWatchifyArgs(entries, output, opt)
    var watchifyProc
    var watcher
    var tinylr

    //no-op until live() is enabled
    emitter.reload = function() {
    }

    //enable file watch capabilities
    emitter.watch = function(glob, watchOpt) {
        watcher = createFileWatch(emitter, glob, watchOpt)
        return emitter
    }

    //enable live-reload capabilities
    emitter.live = function(liveOpt) {
        tinylr = createTinylr(emitter, liveOpt)
        emitter.reload = tinylr.reload.bind(tinylr)
        return emitter
    }

    emitter.close = function() {
        if (closed) 
            return
        closed = true
        if (watchifyProc)
            watchifyProc.kill()
        if (watcher)
            watcher.close()
        if (tinylr)
            tinylr.close()
        server.close()
        emitter.emit('exit')
    }
    
    var server = http(serverOpt)
        .on('error', function(err) {
            emitter.emit('error', err)
        })
        .listen(port, host, function(err) {
            if (err) {
                emitter.emit('error', new Error("Could not connect to server: " + err))
                return 
            }
            if (closed) 
                return

            watchifyProc = watchify(watchifyArgs)
            //when watchify ends, close the server
            watchifyProc.stderr.on('end', function() {
                emitter.close()
            })

            handler()
        })
        

    return emitter

    function handler() {
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