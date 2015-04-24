# API

The API mirrors the CLI except you must provide a `stream` for logging, and it does not attempt to auto-portfind. You can also pass in transforms and plugins as an object, like so:

```js
var budo = require('budo')
var babelify = require('babelify')

budo('./src/index.js', {
  live: true,             //live reload
  transform: babelify,    //ES6 transpiling
  stream: process.stdout, //log to stdout
  port: 8000              //use this port
}).on('connnect', function(ev) {
  //...
})
```

#### `b = budo(entry[, opts])`

Spins up a new instance of `budo`, where `entry` is a path or or array of paths.

The options are the same as CLI, except that the API does not attempt auto portfinding, and does not print to stdout. You can specify a `stream` option to print to.

The return value is an event emitter.

#### `b.on('exit')`

Called when the server is closed.

#### `b.on('error')`

Called on a fatal error, like not being able to create the server.

#### `b.on('connect')`

Called once the budo server connects. The callback is passed an `event` object that looks like this:

```js
{
  uri: 'http://localhost:9966/',  //served URI
  serve: 'bundle/entry%20file.js' //the URL path for our entry file
  dir: 'app',                     //the working directory being served
  host: 'localhost',              //defaults to localhost
  port: 9966                      //the port we're running on
}
```

#### `b.on('update')`

This event is triggered when the bundle changes. It is passed the following:

```(urlPath, src)```

Where `urlPath` is the served name (e.g. `bundle%20file.js`) and `src` is the new contents of the bundle.

#### `b.on('reload')`

If live reload is enabeld (i.e. through `live` or `live-plugin`), this event will be triggered after the LiveReload has been sent. The parameter is `file`, the file path being submitted to the LiveReload server.

#### `b.on('watch')`

If file watching is enabeld (i.e. through `live` or `live-plugin`), this event will be triggered after HTML and CSS files have changed. The parameters will be `(eventType, file)` where `eventType` could be "add", "change", "unlink", etc.

#### `b.reload(path)`

If live reload is enabled (i.e. through `live` or `live-plugin`), this will send a LiveReload event to the given path and then trigger the `"reload"` event.

#### `b.live([opt])`

If `live` and `live-plugin` were not specified, you can manually enable the LiveReload server with the specified options object: `port` (default 35729) and `host` (default to the `host` argument provided to budo, or `localhost`). You can also specify `plugin: true` if you do not want the LiveReload snippet injected into the HTML. 

#### `b.watch([globs, chokidarOpts])`

If `live` and `live-plugin` were not specified, you can manually enabe [chokidar's](https://github.com/paulmillr/chokidar) file watching with the specified `globs` (array or string) and options. 

`globs` defaults to watching `**/*.{html,css}`. `chokidarOpts` defaults to the options passed to the budo constructor.

Example of using `live()` and `watch()` together. This will only trigger LiveReload on CSS updates.

```js
var budo = require('budo')
var path = require('path')
var app = budo('index.js')

app
  //listen to CSS changes
  .watch('*.css', { interval: 300, usePolling: true })
  //start LiveReload server
  .live()
  //handle file events
  .on('watch', function(type, file) {
    //tell LiveReload to inject some CSS
    if (path.extname(file) === '.css')
      app.reload(file)
  })
``` 

# build tools

Budo doesn't need a Grunt or Gulp specific plugin to work, but you may choose to wrap it within your favourite task runner for consistency. A simple case might look like this:

```js
var gulp = require('gulp')
var budo = require('budo')

//start our local development server
gulp.task('dev', function(cb) {
  budo('index.js')
    .on('connect', function(ev) {
      console.log("Server started at "+ev.uri)
    })
    .on('exit', cb)
})
```

Now running `gulp dev` will spin up a server on 9966, spawn watchify, and incrementally rebundle during development. It will stub out an `index.html` and serve the browserified contents of `index.js`. 

#### integrations

- [gulp](https://github.com/mattdesl/budo-gulp-starter)
- [npm scripts](https://gist.github.com/mattdesl/b6990e7c7221c9cc05aa)
- [LiveReactLoad](https://gist.github.com/mattdesl/2aa5b45ed1f230635a04)