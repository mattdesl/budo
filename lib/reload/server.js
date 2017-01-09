var WebSocketServer = require('ws').Server
var log = require('bole')('budo')
var path = require('path')
var isAbsolute = require('path-is-absolute')

module.exports = function (server, opts) {
  opts = opts || {}
  log.info({ message: 'LiveReload running' })

  // get a list of static folders to use as base dirs
  var cwd = path.resolve(opts.cwd || process.cwd())
  var staticDirs = Array.isArray(opts.dir) ? opts.dir : [ opts.dir ]
  staticDirs = staticDirs.map(function (dir) {
    return path.resolve(dir)
  })
  if (staticDirs.indexOf(cwd) === -1) staticDirs.push(cwd)

  var pathSep = path.sep
  var closed = false
  var wss = new WebSocketServer({
    server: server,
    perMessageDeflate: false
  })

  return {
    webSocketServer: wss,
    reload,
    close: function () {
      if (closed) return
      wss.close()
      closed = true
    }
  }

  function reload (file) {
    if (closed) return
    var url, ext

    if (file && typeof file === 'string') {
      // absolute file path
      file = isAbsolute(file) ? path.normalize(file) : path.resolve(cwd, file)

      // make it relative, removing the static folder parts
      for (var i = 0; i < staticDirs.length; i++) {
        var dir = staticDirs[i]
        url = path.relative(dir, file)
        // if the path doesn't starts with "../", then
        // it should be relative to this folder
        if (!/^(\.\.[/\\]|[/\\])/.test(url)) break
      }

      // turn it into a URL
      url = url.replace(new RegExp(pathSep, 'g'), '/')

      // ensure it starts at root of app
      if (url.charAt(0) !== '/') url = '/' + url

      ext = path.extname(file)
    }

    broadcast({ event: 'reload', ext: ext, url: url })
  }

  function broadcast (data) {
    if (closed) return
    data = JSON.stringify(data)
    wss.clients.forEach(function (client) {
      client.send(data, {
        binary: false
      })
    })
  }
}
