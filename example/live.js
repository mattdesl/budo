// An example of custom a LiveReload extension

var budo = require('../')

var liveOpts = {
  // For faster development, re-bundle the LiveReload client
  // on each request
  cache: false,
  // Include source mapping in the LiveReload client
  debug: true,
  // Expose LiveReload client to window.require('budo-livereload')
  expose: true,
  // Additional script(s) to include after the LiveReload client
  include: require.resolve('./live-client.js')
}

budo.cli(process.argv.slice(2), {
  live: liveOpts
}).on('connect', function (ev) {
  var wss = ev.webSocketServer

  // receiving messages from clients
  wss.on('connection', function (socket) {
    console.log('[LiveReload] Client Connected')
    socket.on('message', function (message) {
      console.log('[LiveReload] Message from client:', JSON.parse(message))
    })
  })

  // sending messages to all clients
  setInterval(function () {
    if (wss.clients.length > 0) {
      console.log('[LiveReload] Pinging ' + wss.clients.length + ' clients')
    }
    wss.clients.forEach(function (socket) {
      socket.send(JSON.stringify('ping!'))
    })
  }, 5000)
})
