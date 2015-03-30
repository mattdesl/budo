# API

The API mirrors the CLI except you must provide a `stream` for logging, and it does not attempt to auto-portfind.

```js
var budo = require('budo')

budo('./src/index.js', {
  live: true,             //live reload
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

Called on an error.

#### `b.on('connect')`

Called once the budo server connects. The callback is passed an `event` object that looks like this:

```js
{
  uri: 'http://localhost:9966/', //served URI
  from: 'app/bundle.js',         //the actual path to the bundle
  to: 'bundle.js',               //the mapping server expects
  glob: 'app/bundle.js',         //file glob for bundle.js
  dir: 'app',                    //the working directory
  host: 'localhost',             //defaults to localhost
  port: 9966,                    //the port we're running on
}
```

#### `b.on('watch')`

If file watching is enabeld (i.e. through `live` or `live-plugin`), this event will be triggered after a file change or addition is made (such as bundle.js or themes.css). The parameters will be `(eventType, file)` where `eventType` could be "add", "change", "unlink", etc.

#### `b.on('reload')`

If live reload is enabeld (i.e. through `live` or `live-plugin`), this event will be triggered after the LiveReload has been sent. The parameter is `file`, the file path being submitted to the LiveReload server.

#### `b.reload(path)`

If live reload is enabled (i.e. through `live` or `live-plugin`), this will send a LiveReload event to the given path and then trigger the `"reload"` event.

#### `b.live([opt])`

If `live` and `live-plugin` were not specified, you can manually enable the LiveReload server with the specified options: `port` (default 35729) and `host` (default to the `host` argument provided to budo, or `localhost`). 

#### `b.watch([globs, chokidarOpts])`

If `live` and `live-plugin` were not specified, you can manually enabe [chokidar's](https://github.com/paulmillr/chokidar) file watching with the specified `globs` (array or string) and options. It will default to watching HTML, CSS, and the watchified bundle.

Example of using `live()` and `watch()` together.

```js
var budo = require('budo')
var app = budo('index.js')

app
  //enable file watching
  .watch('*.css', { usePolling: true })
  //start LiveReload server
  .live()
  //handle file events
  .on('watch', function(type, file) {
    //tell LiveReload to inject some CSS
    if (type === 'change')
      app.reload(file)
  })
``` 

# gulp & grunt

Budo works without gulp and grunt, but you may want to wrap it within the same build environment for consistency.

### simple recipe

A simple case of budo within gulp might look like this:

```js
var gulp = require('gulp')
var budo = require('budo')

//start our local development server
gulp.task('dev', function(cb) {
  budo('index.js')
    .on('connect', function(app) {
      console.log("Server started at "+app.uri)
    })
    .on('exit', cb)
})
```

Now running `gulp dev` will spin up a server on 9966, spawn watchify, and incrementally rebundle during development. It will stub out an `index.html` and write `bundle.js` to a temp directory.

### advanced recipes

The following script shows how you can include a few more features to the task:

- uses LiveReload on bundle change
- uses `babelify` for ES6 transpiling 
- uses `errorify` to display syntax errors in the browser
- pretty-prints server requests to stdout with [garnish](https://github.com/mattdesl/garnish)

```js
var gulp = require('gulp')
var budo = require('budo')
var garnish = require('garnish')

//advanced example
gulp.task('default', function(cb) {
  //using garnish for pretty-printing server requests
  var pretty = garnish()
  pretty.pipe(process.stdout)

  budo('index.js', {
    live: true,            //live reload
    stream: pretty,        //output stream
    port: 8000,            //the port to serve on
    plugin: 'errorify',    //nicer errors during dev
    transform: 'babelify'  //ES6 transpiling
  }).on('exit', cb)
})
```

Note that `babelify` and `errorify` need to be saved as local devDependencies.

### demo

[budo-gulp-starter](https://github.com/mattdesl/budo-gulp-starter) demonstrates some more complex applications of budo and gulp.