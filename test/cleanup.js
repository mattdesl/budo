var rimraf = require('rimraf')
var path = require('path')

module.exports = function cleanup(paths) {
  setTimeout(function() {
    var defaults = [
      path.join(__dirname, '/bundle.js'),
      path.join(__dirname, '/.bundle.js')
    ]
    paths = paths || defaults
    paths.forEach(function(file) {
      rimraf(file, function(err) {
        if (err) console.error(err)
      })
    })
  }, 50)
}