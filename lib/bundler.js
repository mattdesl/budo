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
  if (args && Array.isArray(args)) {
    // CLI args for browserify
    bundler = fromArgs(args, bOpts)
  } else {
    // just assume JS only options
    bundler = browserify(bOpts)
  }

  files.forEach(function (file) {
    bundler.add(path.resolve(file))
  })

  return createMiddleware(bundler, {
    delay: opts.delay || 0,
    errorHandler: true
  })
}
