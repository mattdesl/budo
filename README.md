#### beta

budo@5 is still in beta, you can test it like so:

```sh
# install the latest version of budo & garnish
npm install budo@next garnish -g

# run the tools
budo src/index.js | garnish
```

# budō

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

This is a browserify development server inspired by [beefy](https://github.com/chrisdickinson/beefy) and [wzrd](https://github.com/maxogden/wzrd), but specifically focused on incremental reloading, LiveReload integration (including CSS injection), and other high-level features.

To install:

```sh
npm install budo -g
```

Running budo will start a server with a default `index.html` and incrementally bundle your source on filesave. The requests are delayed until the bundle has finished, so you won't be served stale or empty bundles if you refresh the page mid-update. Examples:

```sh
# serve file on port 9966
budo index.js

# enable LiveReload on HTML/CSS/JS file changes
budo index.js --live

# pass some options to browserify
budo index.js --live -- -t babelify
```

Then open [http://localhost:9966/](http://localhost:9966/) to see the content in action.

Budo emits [ndjson](http://ndjson.org), so a pretty-printer like [garnish](https://github.com/mattdesl/garnish) or [bistre](https://github.com/hughsk/bistre) is recommended for better logging. Example:

```sh
# install garnish if you don't have it
npm install garnish -g

# pipe to garnish for pretty-printing
budo index.js | garnish
```

Result:

<center><img src="http://i.imgur.com/a6lMvDY.png" width="80%"></center>

See [docs](#docs) for more details. PRs/suggestions/comments welcome.

## features

At a glance:

- stubs a default `index.html`
- fast incremental bundling, suspending the response until the new source is ready
- watches HTML and CSS files for changes; CSS is injected without reloading the page
- allows for detailed logging with [garnish](https://github.com/mattdesl/garnish)
- provides clear error messaging during development in DOM and console

Below is an example of how syntax errors look during development, using the [babelify](https://github.com/babel/babelify) transform.

![babelify](http://i.imgur.com/fDAKMHE.png)

## docs

- [command line usage](docs/command-line-usage.md)
- [API usage](docs/api-usage.md)
- [running tests and examples](docs/tests-and-examples.md)
- [rapid prototyping with budō](http://mattdesl.svbtle.com/rapid-prototyping)
- [experimental script injection with budo-chrome](https://github.com/mattdesl/budo-chrome)

## usage

[![NPM](https://nodei.co/npm/budo.png)](https://www.npmjs.com/package/budo)

### CLI

Details for `budo` command-line interface.

```sh
Usage:
  budo index.js [opts] -- [browserify opts]

Options:
  --help, -h       show help message
  --version        show version
  --port, -p       the port to run, default 9966
  --host, -H       the host, default "localhost"
  --dir, -d        a path, or array of paths for base static content
  --serve, -s      override the bundle path being served
  --live, -l       enable default LiveReload integration
  --live-port, -L  the LiveReload port, default 35729
  --open, -o       launch the browser once connected
  --pushstate, -P  always render the index page instead of a 404 page
  --poll=N         use polling for file watch, with optional interval N
  --no-stream      do not print messages to stdout
  --no-debug       do not use inline source maps
  --no-portfind    will not attempt auto-portfinding
  --no-error-handler  disable default DOM error handling
```

By default, messages will be printed to `process.stdout`, and `--debug` will be sent to browserify (for source maps). You can turn these off with `--no-stream` and `--no-debug`, respectively. 

Everything after `--` is passed directly to browserify. Example:

```js
budo index.js --live -- -t [ babelify --exetension .es6 ]
```

### API

The API mirrors the CLI except it does not write to `process.stdout` by default.

```js
var budo = require('budo')
var babelify = require('babelify')

budo('./src/index.js', {
  live: true,             // setup live reload
  port: 8000,             // use this port
  browserify: {
    transform: babelify   // ES6
  }
}).on('connnect', function (ev) {
  console.log('Server running on %s', ev.uri)
  console.log('LiveReload running on port %s', ev.livePort)
}).on('update', function (buffer) {
  console.log('bundle - %d bytes', buffer.length)
})
```

See [API usage](docs/api-usage.md) for details.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/budo/blob/master/LICENSE.md) for details.