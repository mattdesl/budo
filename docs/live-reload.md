#### Custom LiveReload

Setting `opts.live` will provide a default configuration for live reloading. You can also specify a string to narrow the LiveReload triggers to a certain glob:

```js
budo('index.js', {
  live: '*.{css,html}'
})
```

Using the `live()` and `watch()` methods instead of passing `opts.live`, you can fine-tune reloading for your use case. The following only triggers LiveReload events on CSS changes.

```js
var budo = require('budo')
var path = require('path')
var app = budo('index.js')

app
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