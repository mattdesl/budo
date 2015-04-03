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
  var pending = true
  var watchify
  var time = Date.now()

  var first = true

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
    emitter.emit('pending')
    pending = true
    bundle()
  })

  function bundle() {
    if (closed) {
      update()
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
      update()
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
      update()
    })
  }
  return emitter

  function update() {
    if (pending) {
      pending = false
      emitter.emit('update')
    }
  }
}