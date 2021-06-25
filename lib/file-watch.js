// a thin wrapper around chokidar file watching HTML / CSS
var {watch} = require('chokidar')
var xtend = require('xtend')
var {EventEmitter} = require('events')

var ignores = [
  'node_modules/**', 'bower_components/**',
  '.git', '.hg', '.svn', '.DS_Store',
  '*.swp', 'thumbs.db', 'desktop.ini'
]

module.exports = function (glob, opt) {
  opt = xtend({
    usePolling: opt && opt.poll,
    ignored: ignores,
    ignoreInitial: true
  }, opt)

  var emitter = new EventEmitter()
  var closed = false

  var watcher = watch(glob, opt)
  watcher.on('add', onWatch.bind(null, 'add'))
  watcher.on('change', onWatch.bind(null, 'change'))

  function onWatch (event, path) {
    emitter.emit('watch', event, path)
  }

  emitter.close = function () {
    if (closed) return
    watcher.close()
    closed = true
  }
  return emitter
}

module.exports.ignores = ignores
