// a thin wrapper around chokidar file watching HTML / CSS
var log = require('bole')('budo')
var watch = require('chokidar').watch
var xtend = require('xtend')
var Emitter = require('events/')

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

  var emitter = new Emitter()
  var closed = false
  var ready = false

  var watcher = watch(glob, opt)
  watcher.on('add', onWatch.bind(null, 'add'))
  watcher.on('change', onWatch.bind(null, 'change'))

  // chokidar@1.0.0-r6 only allows close after ready event
  watcher.once('ready', function () {
    ready = true
    if (closed) watcher.close()
  })

  function onWatch (event, path) {
    emitter.emit('watch', event, path)
    log.debug({
      name: 'file',
      type: event,
      url: path
    })
  }

  emitter.close = function () {
    if (closed) return
    if (ready) watcher.close()
    closed = true
  }
  return emitter
}

module.exports.ignores = ignores
