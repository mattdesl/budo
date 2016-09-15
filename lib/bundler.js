'use strict'

const xtend = require('xtend')
const createMiddleware = require('watchify-middleware').emitter
const fromArgs = require('browserify/bin/args')
const browserify = require('browserify')
const path = require('path')
const defaultErrorHandler = require('./error-handler')

const createBundler = (files, opts) => {
  const bOpts = xtend({
    cache: {},
    packageCache: {},
    debug: opts.debug
  }, opts.browserify)

  let bundler = {}
  const args = opts.browserifyArgs
  if (args && Array.isArray(args)) {
    // CLI args for browserify
    bundler = fromArgs(args, bOpts)
  } else {
    // just assume JS only options
    bundler = browserify(bOpts)
  }

  files.forEach((file) => bundler.add(path.resolve(file)))

  let errorHandler = opts.errorHandler
  if (typeof errorHandler !== 'function' && errorHandler !== false) {
    errorHandler = defaultErrorHandler
  }

  return createMiddleware(bundler, {
    delay: opts.delay || 0,
    initialBundle: false,
    errorHandler: errorHandler
  })
}

module.exports = createBundler
