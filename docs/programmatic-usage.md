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
  
  //also provides a function to close the budo instance
  close()
}
```

It's recommended to use `glob` instead of `from` if you intend to watch the `bundle.js` for file changes (e.g. determining when the bundle is ready to launch the browser). This is due to some issues with OSX temp dir file watching.

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