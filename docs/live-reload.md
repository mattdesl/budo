## Live Reload

A large part of budo is dealing with LiveReload, and it exposes several features that may be useful depending on the tools you are building.

#### `live` parameter

The simplest way to enable LiveReload is to pass a `--live` flag to the CLI or use `{ live: true }` option in the API.

```js
budo('index.js', {
  live: true
})
```

This will provide a default configuration for live reloading. The default configuration also supports a string to narrow the file type which causes reloads:

```js
budo('index.js', {
  live: '*.{css,html}'
})
```

#### Custom LiveReload

Alternatively, you can use the `live()` and `watch()` methods to fine-tune reloading for your use case.

> :warning: If using the `live()` and `watch()` methods, you should leave the `live` option as undefined to ensure it does not add the default configuration.

The following only triggers LiveReload events on CSS changes.

```js
var budo = require('budo')
var path = require('path')

var app = budo('index.js' {
  port: 9966
})
  // listen to CSS file changes with some chokidar options
  .watch('**/*.css', { interval: 300, usePolling: true })
  // start LiveReload WebSocket server
  .live()
  // handle file changes
  .on('watch', function(type, file) {
    // tell LiveReload to inject some CSS
    if (path.extname(file) === '.css') {
      app.reload(file)
    }
  })
  .on('pending', function () {
    console.log('bundle...')
  })
  .on('update', function (buf) {
    console.log('bundle finished --> %d bytes', buf.length)
  })
```

#### Advanced LiveReload Server/Client

In some rare cases, you may want to work directly with the LiveReload client that budo uses, and/or the WebSocketServer that sends reload events. For example, you can augment your current SASS/LESS build pipeline with an in-browser error popup that shows on CSS syntax errors.

Other use cases:

- Sync your application state when a new client (i.e. device) joins the WebSocket server, for example if you are building a multi-device art installation
- Broadcast a message to all clients currently running your app
- Add diagnostic and debugging tools to connect Node.js with the frontend clients running budo

##### WebSocketServer

The `'connect'` event includes a `webSocketServer` instance from the [ws](https://www.npmjs.com/package/ws) module. This can be used to send and receive messages to clients.

```js
budo('index.js')
.on('connect', function (ev) {
  var wss = ev.webSocketServer

  // receiving messages from clients
  wss.on('connection', function (socket) {
    console.log('[LiveReload] Client Connected')
    socket.on('message', function (message) {
      console.log('[LiveReload] Message from client:', JSON.parse(message))
    })
  })

  // send message to all clients every 5 seconds
  setInterval(function () {
    if (wss.clients.length > 0) {
      console.log('[LiveReload] Pinging ' + wss.clients.length + ' clients')
    }
    wss.clients.forEach(function (socket) {
      socket.send(JSON.stringify('ping!'))
    })
  }, 5000)
})
```

#### LiveReload Client

You can also pass an object to `live` to include custom LiveReload client scripts. Then, budo will browserify the default client (which handles reload and CSS injection) and your client (which can handle your custom browser features) on the fly.


- `cache` default true, which means it will only browserify the LiveReload client once. If you specify false, it will re-bundle the LiveReload client on each request (easier for development).
- `debug` default false, which means it will not include source maps in the LiveReload client.
- `expose` if true, budo will expose `window.require('budo-livereload')` in your client. default false
- `include` a file path or array of paths to include after budo's default LiveReload client

Here is a full example:

```js
var budo = require('budo')

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
});
```

Now, your `live-client.js` script can look like this:

```js
var client = require('budo-livereload')
console.log('[LiveReload] Custom Script Attached!')

// You can send a string / object to the WebSocketServer
console.log('[LiveReload] Sending message to WebSocketServer...')
client.send({ event: 'foo', message: 'Hello world!' })

// Or receive parsed JSON data from the WebSocketServer
client.listen(function (data) {
  console.log('[LiveReload] Message form WebSocketServer: ' + data)
})

// Force a client-side error popup
client.showError('Some error message')

// Clear any visible client-side error popup
client.clearError()
```

For a full working example, see [example/live.js](../example/live.js) and [example/live-client.js](../example/live-client.js).
