var browserify = require('browserify')
var path = require('path')
var fs = require('fs')
var UglifyJS = require('uglify-js')

var buildFolder = path.resolve(__dirname, '..', 'build')
var buildFile = path.resolve(buildFolder, 'bundled-livereload-client.js')
var clientFile = path.resolve(__dirname, '..', 'lib', 'reload', 'client.js')

mkdir(buildFolder, function (err) {
  if (err) return error(err)
  browserify().add(clientFile).bundle(function (err, src) {
    if (err) return error(err)
    var result
    try {
      result = UglifyJS.minify(src.toString(), { fromString: true }).code
    } catch (err) {
      return error(err)
    }
    fs.writeFile(buildFile, result, function (err) {
      if (err) error(err)
    })
  })
})

function mkdir (path, cb) {
  fs.mkdir(path, function (err) {
    if (err && err.code === 'EEXIST') err = null
    cb(err)
  })
}

function error (err) {
  console.error('ERROR: Could not bundle LiveReload client, budo ' +
    'will fall back to browserifying it on the fly.')
  console.error(err)
}
