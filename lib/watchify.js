var log = require('bole')('budo')
var createWatchify = require('./create-watchify')
var Emitter = require('events/')
var debounce = require('debounce')
var concat = require('concat-stream')

//Eventually this may split into a watchify-server module
module.exports = function(entries, userArgs, opt) {
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

  createWatchify(entries, userArgs, { 
    cli: opt.cli,
    basedir: opt.dir
  }, function(err, instance) {
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

    watchify = instance
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
      if (!didError) {
        contents = body
        bundleEnd()
      }
    })

    var wb = watchify.bundle()
    wb.on('error', function(err) {
      err = String(err)
      console.error(err)
      contents = 'console.error(' + JSON.stringify(err) + ');'
      didError = true
      bundleEnd()
    })
    wb.pipe(outStream)

    function bundleEnd() {
      if (opt.verbose && !didError) {
        var delay = Date.now() - time
        log.info({
          elapsed: Math.round(delay) + 'ms',
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