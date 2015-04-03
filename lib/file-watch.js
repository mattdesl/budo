//a thin wrapper around chokidar file watching HTML / CSS
var log = require('bole')('budo')
var watch = require('chokidar').watch
var xtend = require('xtend')
var Emitter = require('events/')

var ignores = [
  'node_modules/**', 'bower_components/**',
  '.git', '.hg', '.svn', '.DS_Store',
  '*.swp', 'thumbs.db', 'desktop.ini'
]

module.exports = function(glob, opt) {
  opt = xtend({
    ignored: ignores,
    ignoreInitial: true
  }, opt)

  var emitter = new Emitter()

  watcher = watch(glob, opt)
  watcher.on('add', reload.bind(null, 'add'))
  watcher.on('change', reload.bind(null, 'change'))
  
  function reload(event, path) {
    emitter.emit('watch', event, path)
    log.debug({
      type: event,
      url: path
    })
  }

  emitter.close = function() {
    watcher.close()
  }
  return emitter
}

module.exports.ignores = ignores