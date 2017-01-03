var xtend = require('xtend')
var createMiddleware = require('watchify-middleware').emitter
var fromArgs = require('browserify/bin/args')
var browserify = require('browserify')
var path = require('path')
var defaultErrorHandler = require('./error-handler')

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

  var errorHandler = opts.errorHandler
  if (typeof errorHandler !== 'function' && errorHandler !== false) {
    errorHandler = defaultErrorHandler
  }

  var cwd = opts.cwd
  var rootDirName
  if (cwd) {
    cwd = path.normalize(cwd)
    rootDirName = path.basename(cwd) + path.sep
  }
  return createMiddleware(bundler, {
    delay: opts.delay || 0,
    initialBundle: false,
    errorHandler: typeof errorHandler === 'function'
      ? function (err) { // pass along directories as well
        return errorHandler(err, cwd, rootDirName)
      }
      : errorHandler // pass undefined / false / etc
  })
}
