var xtend = require('xtend')
var createMiddleware = require('watchify-middleware').emitter
var fromArgs = require('browserify/bin/args')
var browserify = require('browserify')
var path = require('path')

module.exports = createBundler
function createBundler (files, opts) {
  var bOpts = xtend({
    cache: {},
    packageCache: {},
    debug: opts.debug
  }, opts.browserify)

  var bundler
  var args = opts.browserifyArgs
  // CLI args for browserify
  if (args && Array.isArray(args)) {
    bundler = fromArgs(args, bOpts)
  }
  // just assume JS only options
  else {
    bundler = browserify(bOpts)
  }

  files.forEach(function (file) {
    bundler.add(path.resolve(file))
  })

  return createMiddleware(bundler, {
    delay: opts.delay,
    errorHandler: true
  })
}
