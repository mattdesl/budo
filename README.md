# budō

[![build status][travis-image]][travis-url]
[![stability][stability-image]][stability-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][downloads-url]
[![js-standard-style][standard-image]][standard-url]

This is a [browserify](https://github.com/substack/node-browserify) development server focused on incremental reloading, LiveReload integration (including CSS injection) and other high-level features for rapid prototyping.

To install it globally:

```sh
npm install budo -g
```

Running budo will start a server with a default `index.html` and incrementally bundle your source on filesave. The requests are delayed until the bundle has finished, so you won't be served stale or empty bundles if you refresh the page mid-update. Examples:

```sh
# serve file on port 9966 and open browser
budo index.js --open

# enable LiveReload on HTML/CSS/JS file changes
budo index.js --live

# default html will use src="static/bundle.js"
budo src/index.js:static/bundle.js

# pass some options to browserify
budo index.js --live -- -t babelify

# use HTTPS and enable CORS headers
budo index.js --ssl --cors

# LiveReload public directory without any bundling
# Add all extensions of file types you want to trigger reloads
budo --dir public/ --wg **/*.{html,css,js} --live
```

Then open [http://localhost:9966/](http://localhost:9966/) to see the content in action.

By default, budo pretty-prints to terminal with [garnish](https://github.com/mattdesl/garnish).

<center><img src="https://raw.githubusercontent.com/mattdesl/budo/master/screenshots/terminal.png" width="75%" /></center>

See [docs](#docs) for more details and integrations, such as [React Hot Module Replacement](./docs/command-line-usage.md#hot-module-replacement), [Pushstate Servers](./docs/command-line-usage.md#pushstate) and [HTTPS](./docs/command-line-usage.md#ssl-and-https). PRs/suggestions/comments welcome.

## features

At a glance:

- serves a default `index.html`
- fast incremental bundling, suspending the response until the new source is ready
- watches HTML and CSS files for changes; CSS is injected without reloading the page
- can emit [ndjson](http://ndjson.org) logs to use another pretty-printer, like [bistre](https://github.com/hughsk/bistre).
- provides clear error messaging during development in DOM and console
- supports SSL and can generate a self-signed certificate
- the rich API allows you to build more complex development tools on top of budo

Below is an example of how syntax errors look during development, using the [babelify](https://github.com/babel/babelify) transform.

<center><img src="https://raw.githubusercontent.com/mattdesl/budo/master/screenshots/build-error.png" width="75%" /></center>

## docs

- [command line usage](./docs/command-line-usage.md)
- [API usage](./docs/api-usage.md)
- [running tests and examples](./docs/tests-and-examples.md)
- [rapid prototyping with budō](http://mattdesl.svbtle.com/rapid-prototyping)
- [experimental script injection with budo-chrome](https://github.com/mattdesl/budo-chrome)

## usage

[![NPM](https://nodei.co/npm/budo.png)](https://www.npmjs.com/package/budo)

### CLI

Details for `budo` command-line interface.

```txt
Usage:
  budo index.js [opts] -- [browserify opts]

Options:
  --help, -h       show help message
  --version        show version
  --port, -p       the port to run, default 9966
  --host, -H       the host, default internal IP (localhost)
  --dir, -d        a path, or array of paths for base static content
  --serve, -s      override the bundle path being served
  --live, -l       enable default LiveReload integration
  --live-port, -L  the LiveReload port, default 35729
  --open, -o       launch the browser once connected
  --pushstate, -P  always render the index page instead of a 404 page
  --base           set the base path for the generated HTML, default to '/'
  --onupdate       a shell command to trigger on bundle update
  --poll=N         use polling for file watch, with optional interval N
  --title          optional title for default index.html
  --css            optional stylesheet href for default index.html
  --ssl, -S        create an HTTPS server instead of HTTP
  --cert, -C       the cert for SSL (default cert.pem)
  --key, -K        the key for SSL (default key.pem)
  --cors           set header to use CORS (Access-Control-Allow-Origin: *)
  --ndjson         print ndjson instead of pretty-printed logs
  --verbose, -v    also include debug messages
  --force-default-index always serve a generated index.html instead of a static one
  --no-stream      do not print messages to stdout
  --no-debug       do not use inline source maps
  --no-portfind    will not attempt auto-portfinding
  --no-error-handler    disable default DOM error handling
  --watch-glob, --wg    glob(s) to watch for reloads, default '**/*.{html,css}'
  --static-options      subarg options to pass to serve-static module
```

By default, messages will be printed to `process.stdout`, and `--debug` will be sent to browserify (for source maps). You can turn these off with `--no-stream` and `--no-debug`, respectively.

Everything after `--` is passed directly to browserify. Example:

```js
budo index.js --live -- -t [ babelify --extensions .es6 ]
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
}).on('connect', function (ev) {
  console.log('Server running on %s', ev.uri)
  console.log('LiveReload running on port %s', ev.livePort)
}).on('update', function (buffer) {
  console.log('bundle - %d bytes', buffer.length)
})
```

See [API usage](docs/api-usage.md) for details.

## See Also

budō combines several smaller and less opinionated modules.

- [watchify-middleware](https://www.npmjs.com/package/watchify-middleware) - the underlying request handler for serving incremental reloads
- [watchify-server](https://www.npmjs.com/package/watchify-server) - a less opinionated alternative to budo, built on the same underlying modules
- [simple-html-index](https://www.npmjs.com/package/simple-html-index) - a stream for a default `index.html` file

Also, special thanks to [beefy](https://github.com/chrisdickinson/beefy) and [wzrd](https://github.com/maxogden/wzrd) which originally inspired budo.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/budo/blob/master/LICENSE.md) for details.

[stability-image]: https://img.shields.io/badge/stability-stable-brightgreen.svg?style=flat-square
[stability-url]: https://nodejs.org/api/documentation.html#documentation_stability_index
[npm-image]: https://img.shields.io/npm/v/budo.svg?style=flat-square
[npm-url]: https://npmjs.org/package/budo
[travis-image]: https://img.shields.io/travis/mattdesl/budo/master.svg?style=flat-square
[travis-url]: http://travis-ci.org/mattdesl/budo
[downloads-image]: http://img.shields.io/npm/dm/budo.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/budo
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
