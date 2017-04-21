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
}).on('connect', function(ev) {
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
- `live` (Boolean|String|Object)
  - whether to set up a default LiveReload integration (see [LiveReload](./live-reload.md))
  - if a string is specified, only filenames matching that glob
    will trigger LiveReload events
  - object will be passed along to the [`live()`](#bliveopt) function
- `cors` (Boolean)
  - Set the header to use CORS (`Access-Control-Allow-Origin: *`)
- `ssl` (Boolean)
  - Creates an HTTPS server instead of HTTP
- `cert` (String)
  - The SSL public certificate file path (default `'cert.pem'`)
- `key` (String)
  - The SSL private key file path (default `'key.pem'`)
- `watchGlob` (Array|String)
  - a glob string or array of glob strings to use as the default when `opts.live` is specified, or when `live()` is called without arguments
  - defaults to `'**/*.{html,css}'`
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
- `title` (String)
  - an optional `<title>` to use for the default `index.html`
- `css` (String)
  - an optional `<link href>` stylesheet URL to use for the default `index.html`
- `browserify` (Object)
  - an object of options passed to browserify
- `browserifyArgs` (Array)
  - an array of command-line arguments passed to browserify
  - if specified, this will be used to construct the new instance
- `middleware` (Array|Function)
  - an optional function or array of `fn(req, res, next)` functions for the server which is run before other routes; using `connect` style middleware
- `errorHandler` (Boolean|Function)
  - whether to include a DOM-based reporter build/syntax errors (default `true`)
  - can be a `reporter(err)` function which takes an Error and returns the new bundle contents
- `forceDefaultIndex` (Boolean)
  - whether to always generate index.html instead of serving a static file, if one is present (default: `false`)
- `pushstate` (Boolean)
  - enable push state support, which defaults 404 routes to the index (default `false`)
  - Recommended you also add something like `<base href="/">` to your HTML `<head>`
- `base` (Boolean|String)
  - add `<base href="/">` to the generated default HTML page if set to true, or uses the specified path if it's a string
- `verbose` (Boolean)
  - also print `'debug'` level messages to garnish; such as the pending state of the bundle and how many files changed in the last update.
- `defaultIndex` (Function)
  - a function `fn(params, req)` that returns a Readable stream, takes the following `params`:  
  `{ entry: opts.serve, title: opts.title, css: opts.css }`
  - defaults to [simple-html-index](https://github.com/mattdesl/simple-html-index)
- `staticOptions` (Object)
  - an object passed to [serve-static](https://www.npmjs.com/package/serve-static) options
  - this object is merged with the default options: `{ cacheControl: false }`

### `b = budo.cli(args[, opts])`

Runs budo as a command-line tool, from the specified array of arguments and an optional `opts` object for overrides. The options are the same as above.

This method returns the `budo` instance, or `null` if the `args` command includes `--version` or `--help`.

For example, running the following script from the command line would behave like budo, but with some added features by default:

```js
var args = process.argv.slice(2)
var babelify = require('babelify')

var budo = require('budo').cli(args, {
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

- `plugin` if true, the HTML will not have the LiveReload script injected into it, default false
- `path` the script URL for the LiveReload client, defaults to `'/budo/livereload.js'`
- `include` a path or array of paths to files that should be added to the LiveReload client, defaults to an empty array
- `cache` whether to cache the LiveReload client file (faster) or re-bundle it on each request (easier to develop LiveReload clients), default `true`
- `debug` whether to add source maps to the bundled LiveReload client, default `false`
- `expose` whether to expose `require('budo-livereload')` on the global context, default false

See [LiveReload](./live-reload.md) for details.

#### `b.watch([globs, chokidarOpts])`

If `live` was not specified, you can manually enabe [chokidar's](https://github.com/paulmillr/chokidar) file watching with the specified `globs` (array or string) and options.

`globs` defaults to watching `**/*.{html,css}`.

See [LiveReload](./live-reload.md) for details.

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
  entries: [ 'entry file.js' ],   // an array of entry file paths
  server: HTTPServer              // the HTTP/HTTPS server
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

#### http server

A static HTTP server with no browserify capabilities, LiveReload integration, and a custom glob to watch for.

```js
budo({
  live: true,
  watchGlob: '{src,examples}/**/*.{html,css,js}'
})
```


#### middleware

Using `middleware` to create a small non-static server. This can be an array of functions, or just a single function.

```js
var url = require('url')

var app = budo('./app.js', {
  middleware: function (req, res, next) {
    if (url.parse(req.url).pathname === '/api') {
      res.statusCode = 200
      res.end('hello world')
    } else {
      // fall through to other routes
      next()
    }
  }
})
```

#### Folders Mapping to `.html` Files

Let's say your dev server should map `localhost:9966/about` and `localhost:9966/about/` to an HTML file called `localhost:9966/about.html`. You can specify options to the underlying static middleware and remove trailing slashes like so:

```js
// dev.js
var slashes = require('connect-slashes')

require('budo').cli({
  middleware: slashes(false),
  staticOptions: {
    index: false,
    extensions: [ 'html', 'htm' ]
  }
})
```

Now you can run the above `dev.js` file just like you would budo:

```sh
node dev.js src/index.js:bundle.js --live -- -t babelify
```

# build tools

Budo doesn't need a Grunt or Gulp specific plugin to work. Instead, if you wish to use Grunt or Gulp, it is safer to require `budo` directly, and wrap it within your task runner:

```js
var gulp = require('gulp')
var budo = require('budo')

//start our local development server
gulp.task('dev', function(cb) {
  budo('index.js', {
    stream: process.stdout
  }).on('connect', function(ev) {
      // do something on connect ...
    })
    .on('exit', cb)
})
```

Now running `gulp dev` will spin up a server on 9966, spawn watchify, and incrementally rebundle during development. It will stub out an `index.html` and serve the browserified contents of `index.js` and write pretty-printed logs to `stdout`.
