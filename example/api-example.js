var path = require('path')
var serveIndex = require('serve-index')
var compress = require('compression')

require('../').cli(process.argv.slice(2), {
  live: true,
  dir: __dirname,
  browserify: {
    transform: require('babelify').configure({
      presets: [ 'es2015' ]
    })
  },
  middleware: [
    compress(),
    serveIndex(__dirname)
  ]
})
