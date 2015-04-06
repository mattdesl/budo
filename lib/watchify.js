var log = require('bole')('budo')
var getWatchify = require('./get-watchify')
var Emitter = require('events/')
var debounce = require('debounce')
var path = require('path')
var concat = require('concat-stream')

module.exports = function(watchifyArgs, opt) {
  var emitter = new Emitter()
  var delay = opt.delay
  var closed = false
  var pending = true
  var watchify
  var time = Date.now()

  var contents = null

  emitter.close = function() {
    if (closed)
      return
    closed = true
    if (watchify) {
      //needed for watchify@3.0.0
      //see test-close-immediate
      //this needs to be revisited upstream
      setTimeout(function() {
        watchify.close()
      }, 50)
    }
  }

  getWatchify({ basedir: opt.dir }, function(err, fromArgs) {
    if (err) { 
      var msg = [
        err.message,
        'Example:',
        '  npm install watchify --save-dev\n'
      ].join('\n')
      emitter.emit('error', new Error(msg))
      return
    }
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
    
    var outStream = concat(function(body) {
      contents = body
      bundleEnd()
    })

    var wb = watchify.bundle()
    wb.on('error', function(err) {
      err = String(err)
      console.error(err)
      didError = true
      outStream.end('console.error(' + JSON.stringify(err) + ');')
    })
    wb.pipe(outStream)

    outStream.on('error', function(err) {
      console.error(err)
      update()
    })
    
    function bundleEnd() {
      if (opt.verbose && !didError) {
        var delay = Date.now() - time
        log.info({
          elapsed: (delay / 1000).toFixed(2) + ' s',
          type: 'bundle',
          url: opt.serve
        })
      }
      update()
    }
  }
  return emitter

  function update() {
    if (pending) {
      pending = false
      emitter.emit('update', contents)
    }
  }
}