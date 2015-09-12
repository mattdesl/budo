# API

The API mirrors the CLI except you must provide a `stream` for logging, and it provides a couple extra options.

### `b = budo([entry], [opts])`

Sets up a new instance of `budo`, where `entry` is a path or or array of paths.

`entry` can be optional -- if no entry paths are given, budo simply acts as a static HTTP server with optional LiveReload. 

The return value is an event emitter.

Examples:

```js
var budo = require('budo')
var babelify = require('babelify')

budo('./src/index.js', {
  live: true,             // live reload
  stream: process.stdout, // log to stdout
  port: 8000,             // use this as the base port
  browserify: {
    transform: babelify   // use ES6
  }
}).on('connnect', function(ev) {
  //...
})
```

#### `opts`

All settings are optional.

- `port` (Number)
  - the base port to use for the development server (default `9966`)
- `livePort` (Number) 
  - the base port to use for the LiveReload server (default `35729`)
- `portfind` (Boolean) 
  - whether to use portfinding to find the next available ports (default `true`)
- `host` (String)
  - the host to listen on (default `'localhost'`)
- `live` (Boolean|String) 
  - whether to set up a default LiveReload integration (see [LiveReload](#livereload))
  - if a string is specified, only filenames matching that glob
    will trigger LiveReload events
- `open` (Boolean)
  - whether to launch the browser (default `false`)
- `dir` (String|Array)
  - a folder or list of folders to use as the base path for static assets (default `process.cwd()`)
  - a default `index.html` will be searched in the first `dir` folder
- `stream` (writable stream)
  - a writable stream like `process.stdout` for ndjson logging (default `undefined`)
- `debug` (Boolean)
  - whether to enable source maps from browserify (default `true`)
- `serve` (String)
  - if specified, the `<script src>` will use this path; defaults to first entry filename
- `browserify` (Object)
  - an object of options passed to browserify
- `browserifyArgs` (Array)
  - an array of command-line arguments passed to browserify
  - if specified, this will be used to construct the new instance
- `middleware` (Function)
  - an optional `fn(req, res, next)` function for the server which is run before other routes
- `errorHandler` (Boolean|Function)
  - whether to include a DOM-based reporter build/syntax errors (default `true`)
  - can be a `reporter(err)` function which takes an Error and returns the new bundle contents
- `pushstate` (Boolean)
  - enable push state support, which defaults 404 routes to the index (default `false`)
- `defaultIndex` (Function)
  - a function `fn(opt)` that returns a Readable stream, takes parameter `{ entry: opts.serve }`
  - defaults to [simple-html-index](https://github.com/mattdesl/simple-html-index)
  
### `b = budo.cli(args[, opts])`

Runs budo as a command-line tool, from the specified array of arguments and an optional `opts` object for overrides. The options are the same as above.

This method returns the `budo` instance, or `null` if the `args` command includes `--version` or `--help`.

For example, running the following script from the command line would behave like budo, but with some added features by default:

```js
var args = process.argv.slice(2)
var babelify = require('babelify')

var budo = require('budo')(args, {
  // additional overrides for our custom tool
  pushstate: true,
  browserify: {
    transform: babelify
  }
})
```

*Note:* In the CLI, anything after `--` gets passed to `opts.browserifyArgs`. Whenever `opts.browserifyArgs` is specified, browserify will be created with [browserify/bin/args](https://github.com/substack/node-browserify/blob/master/bin/args.js) instead of its usual constructor.

#### `b.close()`

Closes the budo instance and its associated server/watcher/etc.

#### `b.reload([path])`

If live reload is enabled (i.e. through `opts.live` or `live()`), this will send a LiveReload event to the given path and then trigger the `"reload"` event.

If `path` is undefined, this is treated as a hard page reload.

#### `b.live([opt])`

If `live` was not specified, you can manually enable the LiveReload server with the specified `opt` options: 

- `port` defaults to the `ev.livePort` from the `'connect'` event
- `host` defaults to the `ev.host` from the `'connect'` event
- `plugin` if true, the HTML will not have the LiveReload script injected into it

See [LiveReload](#livereload) for an example.

#### `b.watch([globs, chokidarOpts])`

If `live` was not specified, you can manually enabe [chokidar's](https://github.com/paulmillr/chokidar) file watching with the specified `globs` (array or string) and options. 

`globs` defaults to watching `**/*.{html,css}`.

See [LiveReload](#livereload) for an example.

## events

#### `b.on('exit', fn)`

Called when the server is closed.

#### `b.on('error', fn)`

Called on a fatal error, like not being able to create the server.

#### `b.on('connect', fn)`

Called once the budo server connects. The callback is passed an `event` object that looks like this:

```js
{
  uri: 'http://localhost:9966/',  // served URI
  serve: 'bundle/entry%20file.js' // the URL path for our entry file
  dir: 'app',                     // the working directory being served
  host: 'localhost',              // defaults to localhost
  port: 9966,                     // the port we're running on
  livePort: 35729,                // the next available LiveReload port
  entries: [ 'entry file.js' ]    // an array of entry file paths
}
```

*Note:* The `dir` field might be a string or array, depending on user input.

#### `b.on('pending', fn)`

Called when the source changes and begins the new incremental reload.

#### `b.on('update', fn)`

Called after the `'pending'` event, once the bundle has finished reloading. It is passed the following:

```fn(contents, changedDependencies)```

Where `contents` is a Buffer with the new bundle source, and `changedDependencies` is an array of dependencies that were changed since last bundle. On the initial update, this array will be empty.

#### `b.on('reload', fn)`

Called after LiveReload has triggered a new event. The listener should have the signature `fn(file)`, where `file` is the path being reloaded.

This is only called when `opts.live` is specified, or after `b.reload(file)` is manually called.

#### `b.on('watch', fn)`

Called after a file watch event with the signature: `fn(event, file)`, where `event` could be "add", "change", "unlink", etc and `file` is the file path being changed.

If `opts.live` was not specified, and `b.watch()` was never set up, this event will not get called.

# examples

#### LiveReload

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
  // start LiveReload server
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

#### middleware

Using `middleware` to create a small non-static server.

```js
var url = require('url')

var app = budo('./app.js', {
  middleware: function (req, res, next) {
    if (url.parse(req.url).pathname === '/api') {
      res.statusCode = 200
      res.end('hello world')
    } else {
      // fall through to other budo routes
      next()
    }
  }
})
```

#### LiveReloading LESS content

You can use `middleware` to compile LESS on the fly, without having to change the CSS paths in your `index.html` file. See [example/budo-less.js](../example/budo-less.js) for an example of this.

# build tools

Budo doesn't need a Grunt or Gulp specific plugin to work, but you may choose to wrap it within your favourite task runner for consistency. A simple case might look like this:

```js
var gulp = require('gulp')
var budo = require('budo')

//start our local development server
gulp.task('dev', function(cb) {
  budo('index.js')
    .on('connect', function(ev) {
      console.log('Server started at ' + ev.uri)
    })
    .on('exit', cb)
})
```

Now running `gulp dev` will spin up a server on 9966, spawn watchify, and incrementally rebundle during development. It will stub out an `index.html` and serve the browserified contents of `index.js`. 
