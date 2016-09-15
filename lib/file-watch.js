'use strict'

// a thin wrapper around chokidar file watching HTML / CSS
const watch = require('chokidar').watch
const xtend = require('xtend')
const Emitter = require('events/')

const ignores = [
  'node_modules/**', 'bower_components/**',
  '.git', '.hg', '.svn', '.DS_Store',
  '*.swp', 'thumbs.db', 'desktop.ini'
]

module.exports = (glob, opt) => {
  opt = xtend({
    usePolling: opt && opt.poll,
    ignored: ignores,
    ignoreInitial: true
  }, opt)

  let closed = false
  let ready = false
  const emitter = new Emitter()
  const onWatch = (event, path) => {
    emitter.emit('watch', event, path)
  }

  const watcher = watch(glob, opt)
  watcher.on('add', onWatch.bind(null, 'add'))
  watcher.on('change', onWatch.bind(null, 'change'))

  // chokidar@1.0.0-r6 only allows close after ready event
  watcher.once('ready', () => {
    ready = true
    if (closed) watcher.close()
  })

  emitter.close = () => {
    if (closed) return
    if (ready) watcher.close()
    closed = true
  }
  return emitter
}

module.exports.ignores = ignores
