// An example of special LiveReload handling
var budo = require('../')

var liveOpts = {
  // for faster dev, re-bundle the LiveReload client
  // on each request
  cache: false,
  // include source mapping in the LiveReload client
  debug: true,
  // expose LiveReload client to window.require('budo-livereload')
  expose: true,
  // this is a file path or array of file paths to be
  // included AFTER the default budo LiveReload client
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
  setInterval(ping, 5000)

  function ping () {
    if (wss.clients.length > 0) {
      console.log('[LiveReload] Pinging ' + wss.clients.length + ' clients')
    }
    wss.clients.forEach(function (socket) {
      socket.send(JSON.stringify('ping!'))
    })
  }
})
