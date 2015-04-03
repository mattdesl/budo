var log = require('bole')('budo')
var path = require('path')
var getWatchify = require('./get-watchify')
var dargs = require('dargs')
var Emitter = require('events/')
var debounce = require('debounce')
var fs = require('fs')
var path = require('path')

module.exports = function(watchifyArgs, opt) {
  var emitter = new Emitter()
  var delay = opt.delay
  var closed = false
  var pending = false
  var watchify
  var time = Date.now()

  emitter.close = function() {
    if (closed)
      return
    closed = true
    if (watchify)
      watchify.close()
  }

  getWatchify({ basedir: opt.dir }, function(err, fromArgs) {
    if (err) 
      return emitter.emit('error', err)
    if (closed)
      return 

    watchify = fromArgs(watchifyArgs)

    var bundleDebounced = debounce(bundle, delay)
    watchify.on('update', function() {
      emitter.emit('pending')
      pending = true
      time = Date.now()
      bundleDebounced()
    })
      
    //initial bundle
    time = Date.now()
    bundle()
  })

  function bundle() {
    if (closed) {
      if (pending) {
        pending = false
        emitter.emit('update')
      }
      return
    }

    var didError = false
    var outStream = fs.createWriteStream(opt.outfile)
    var basename = path.basename(opt.outfile)

    var wb = watchify.bundle()
    wb.on('error', function(err) {
      console.error(String(err))
      didError = true
      outStream.end('console.error(' + JSON.stringify(String(err)) + ');')
    })
    wb.pipe(outStream)

    outStream.on('error', function(err) {
      console.error(err)
      if (pending) {
        pending = false
        emitter.emit('update')
      }
    })
    outStream.on('close', function() {
      if (opt.verbose && !didError) {
        var delay = Date.now() - time
        log.info({
          elapsed: (delay / 1000).toFixed(2) + ' s',
          type: 'bundle',
          url: basename
        })
      }
      pending = false
      emitter.emit('update')
    })
  }
  return emitter
}




/*
var spawn = require('npm-execspawn')
var quote = require('shell-quote').quote

//Runs watchify with given args, returns process
module.exports = function(watchifyArgs) {
  var cmd = ['watchify']
    .concat(quote(watchifyArgs || []))
    .join(' ')

  var proc = spawn(cmd)
  proc.stderr.on('data', function(err) {
    //nicer messaging for common error cases
    if (err.toString().indexOf('watchify: command not found') >= 0) {
      process.stderr.write("ERROR: Could not find watchify\n")
      process.stderr.write("Make sure to install it locally with --save-dev\n")
    } else 
      process.stderr.write(err.toString())
  })

  var hasClosed = false
  process.on('close', handleClose)
  process.on('exit', handleClose)

  return proc

  function handleClose() {
    if (hasClosed) return
    hasClosed = true
    proc.kill()
  }
}*/