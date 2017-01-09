// This is a custom LiveReload script that
// can send and receive custom events.
var client = require('budo-livereload')
console.log('[LiveReload] Custom Script Attached!')

// You can send a string / object to the server
console.log('[LiveReload] Sending message to server...')
client.send({ event: 'foo', message: 'Hello world!' })

// Or receive parsed JSON data
client.listen(function (data) {
  console.log('[LiveReload] Message form server: ' + data)
})

