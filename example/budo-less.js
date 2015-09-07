var budo = require('../')
var less = require('less-css-stream')
var fs = require('fs')
var path = require('path')
var url = require('url')

// tell script to run from this
process.chdir(__dirname)

var lessEntry = path.resolve(__dirname, 'style.less')
var cssEntry = 'main.css'
var app = budo('./app.js', {
  serve: 'bundle.js',
  dir: __dirname,
  stream: process.stdout,
  middleware: middleware
}).live()
  .watch(['**/*.{html,less}'])
  .on('watch', function (ev, file) {
    if (/\.less$/i.test(file)) {
      // tell app to re-request CSS entry point
      app.reload(cssEntry)
    } else {
      app.reload(file)
    }
  })
  .on('pending', function () {
    // also trigger JS hard reloads
    app.reload()
  })

// compile style.less to main.css
function middleware (req, res, next) {
  if (url.parse(req.url).pathname === '/' + cssEntry) {
    res.setHeader('Content-Type', 'text/css')
    fs.createReadStream(lessEntry)
      .pipe(less(lessEntry))
      .pipe(res)
  } else {
    next()
  }
}
