// This is a custom LiveReload script that
// can send and receive custom events.
var client = require('budo-livereload')
console.log('[LiveReload] Custom Script Attached!')

// You can send a string / object to the WebSocketServer
console.log('[LiveReload] Sending message to WebSocketServer...')
client.send({ event: 'foo', message: 'Hello world!' })

// Or receive parsed JSON data from the WebSocketServer
client.listen(function (data) {
  console.log('[LiveReload] Message form WebSocketServer: ' + data)
})
