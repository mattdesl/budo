
var path = require('path')
var resolve = require('resolve')
var getModule = require('./get-module')
var dargs = require('dargs')
var Emitter = require('events/')
var debounce = require('debounce')
var fs = require('fs')

module.exports = function(watchifyArgs, opt) {
  var emitter = new Emitter()
  var delay = opt.delay
  var pending = false
  var closed = false
  var watchify

  emitter.close = function() {
    if (closed)
      return
    closed = true
    if (watchify)
      watchify.close()
  }

  find(opt, function(err, fromArgs) {
    if (err) 
      return emitter.emit('error', err)
    if (closed)
      return 

    watchify = fromArgs(watchifyArgs)

    var bytes, time
    watchify.on('bytes', function (b) { bytes = b })
    watchify.on('time', function (t) { time = t })

    var bundleDebounced = debounce(bundle, delay)
    watchify.on('update', function() {
      pending = true
      emitter.emit('bundle:pending')
      bundleDebounced()
    })
    bundle()
  })

  function bundle() {
    if (closed)
      return

    pending = false
    emitter.emit('bundle:start')

    var didError = false
    var outStream = fs.createWriteStream(opt.outfile)

    var wb = watchify.bundle()
    wb.on('error', function(err) {
      console.error(String(err))
      didError = true
      outStream.end('console.error(' + JSON.stringify(String(err)) + ');')
    })
    wb.pipe(outStream)

    outStream.on('error', function(err) {
      console.error(err)
    })
    outStream.on('close', function() {
      if (opt.verbose && !didError) {
        console.error(bytes + ' bytes written to ' + outfile + ' (' + (time / 1000).toFixed(2) + ' seconds)')
      }
      emitter.emit('bundle:end')
    })
  }

  return emitter
}

function find(opt, cb) {
  getModule('watchify', { basedir: opt.dir }, function(err, result) {
    if (err) 
      return cb(err)

    resolve('watchify/bin/args.js', { basedir: result }, resolved)  
    function resolved(err, watchifyModule) {
      if (err)
        return cb(err)
      var fromArgs = require(watchifyModule)
      cb(null, fromArgs)
    }
  })
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