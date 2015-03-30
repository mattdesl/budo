//a thin wrapper around chokidar file watching 
var log = require('bole')('budo')
var watch = require('chokidar').watch
var xtend = require('xtend')
var Emitter = require('events/')

var ignore = [
  'node_modules/**', 'bower_components/**',
  '.git', '.hg', '.svn', '.DS_Store',
  '*.swp', 'thumbs.db', 'desktop.ini'
]

module.exports = function(glob, opt) {
  opt = xtend({
    event: 'all',
    ignored: ignore,
    ignoreInitial: true
  }, opt)

  var emitter = new Emitter()

  watcher = watch(glob, opt)
  watcher.on(opt.event, opt.event === 'all' ? reload : reload.bind(null, 'change'))
  
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