var fs = require("fs")
const {pipeline, PassThrough} = require("stream")
var createWatchify = require('watchify')
var {EventEmitter} = require('events')
var debounce = require('debounce')
var concat = require('concat-stream')
var stripAnsi = require('strip-ansi')



module.exports = function watchifyMiddleware (browserify, opt) {
  var emitter = createEmitter(browserify, opt)
  return emitter.middleware
}

module.exports.emitter = createEmitter
module.exports.createEmitter = createEmitter
module.exports.createMiddleware = createEmitter

module.exports.getWatchifyVersion = function () {
  return require('watchify/package.json').version
}

// parses a syntax error for pretty-printing to console
function parseError (err) {
  if (err.codeFrame) { // babelify@6.x
    return [err.message, err.codeFrame].join('\n\n')
  } else { // babelify@5.x and browserify
    return err.annotated || err.message
  }
}



function createBundler(browserify, opt) {
  opt = opt || {}
  var emitter = new EventEmitter()
  var delay = opt.delay || 0
  var closed = false
  var pending = false
  var time = Date.now()
  var updates = []
  var errorHandler = opt.errorHandler
  if (errorHandler === true) {
    errorHandler = defaultErrorHandler
  }

  var watchify = createWatchify(browserify, Object.assign({}, opt, {
    // we use our own debounce, so make sure watchify
    // ignores theirs
    delay: 0
  }))
  var contents = null

  emitter.close = function () {
    if (closed) return
    closed = true
    if (watchify) {
      // needed for watchify@3.0.0
      // this needs to be revisited upstream
      setTimeout(function () {
        watchify.close()
      }, 200)
    }
  }

  var bundleDebounced = debounce(bundle, delay)
  watchify.on('update', function (rows) {
    if (closed) return
    updates = rows
    pending = true
    time = Date.now()
    emitter.emit('pending', updates)
    bundleDebounced()
  })

  emitter.bundle = function () {
    if (closed) return
    time = Date.now()
    if (!pending) {
      pending = true
      process.nextTick(function () {
        emitter.emit('pending', updates)
      })
    }
    bundle()
  }

  // initial bundle
  if (opt.initialBundle !== false) {
    emitter.bundle()
  }

  return emitter

  function bundle () {
    if (closed) {
      update()
      return
    }

    var didError = false
    var outStream = concat(function (body) {
      if (!didError) {
        contents = body

        var delay = Date.now() - time
        emitter.emit('log', {
          contentLength: contents.length,
          elapsed: Math.round(delay),
          level: 'info',
          type: 'bundle'
        })

        bundleEnd()
      }
    })

    var wb = watchify.bundle()
    // it can be nice to handle errors gracefully
    if (typeof errorHandler === 'function') {
      wb.once('error', function (err) {
        err.message = parseError(err)
        contents = errorHandler(err) || ''

        didError = true
        emitter.emit('bundle-error', err)
        bundleEnd()
      })
    } else {
      wb.once('error', function (err) {
        err.message = parseError(err)
        emitter.emit('error', err)
        emitter.emit('bundle-error', err)
      })
    }

    if(opt.output && opt.output.file) {
      wb.pipe(fs.createWriteStream(opt.output.file))
    }
    
    wb.pipe(outStream)

    

    function bundleEnd () {
      update()
    }
  }

  function update () {
    if (closed) return
    if (pending) {
      pending = false
      emitter.emit('update', contents, updates)
      updates = []
    }
  }
}

function defaultErrorHandler (err) {
  console.error('%s', err)
  var msg = stripAnsi(err.message)
  return ';console.error(' + JSON.stringify(msg) + ');'
}






function createEmitter (browserify, opt) {
  var bundler = createBundler(browserify, opt)
  var pending = false
  var contents = ''

  bundler.on('pending', function () {
    pending = true
  })

  bundler.on('update', function (data) {
    pending = false
    contents = data
  })

  bundler.middleware = function middleware (req, res) {
    if (pending) {
      bundler.emit('log', {
        level: 'debug',
        type: 'request',
        message: 'bundle pending'
      })

      bundler.once('update', function () {
        bundler.emit('log', {
          level: 'debug',
          type: 'request',
          message: 'bundle ready'
        })
        submit(req, res)
      })
    } else {
      submit(req, res)
    }
  }

  return bundler

  function submit (req, res) {
    res.setHeader('content-type', 'application/javascript; charset=utf-8')
    res.setHeader('content-length', contents.length)
    res.statusCode = req.statusCode || 200
    res.end(contents)
  }
}
