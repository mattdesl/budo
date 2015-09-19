#### 5.0.0-beta

budo@5 is in beta, you can test it like so:

```sh
# install the latest version of budo & garnish
npm install budo@next garnish -g

# run the tools
budo src/index.js | garnish
```

More details and docs in the [next](https://github.com/mattdesl/budo/tree/next) branch.

# budō

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

This is a browserify development server inspired by [beefy](https://github.com/chrisdickinson/beefy) and [wzrd](https://github.com/maxogden/wzrd), but specifically focused on incremental reloading and LiveReload integration (including CSS injection).

To install:

```sh
npm install budo -g
```

Running budo will start a server with a default `index.html` and incrementally bundle your source on filesave. The requests are delayed until the bundle has finished, so you won't be served stale or empty bundles if you refresh the page mid-update. Examples:

```sh
# serve file on port 9966
budo index.js

# enable LiveReload on html/css/js changes
# show timing information on re-bundle
budo index.js --verbose --live

# pass some options to browserify
budo index.js --live -- -t babelify --full-paths
```

Then open [http://localhost:9966](http://localhost:9966) to see the content in action.

To pretty-print in terminal, [garnish](https://github.com/mattdesl/garnish), [bistre](https://github.com/hughsk/bistre) or another [ndjson](http://ndjson.org)-based stream can be used. Example:

```sh
# install garnish if you don't have it
npm install garnish -g

# pipe to garnish for pretty-printing
budo index.js | garnish
```

See [docs](#docs) for more features. PRs/suggestions/comments welcome.

## docs

- [basic usage](docs/basics.md)
- [comparisons](docs/comparisons.md)
- [API and integrations (Gulp, Grunt, npm scripts)](docs/programmatic-usage.md)
- [error reporting](docs/errors.md)
- [running tests and examples](docs/tests-and-examples.md)
- [script injection with budo-chrome](https://github.com/mattdesl/budo-chrome)
- [rapid prototyping with budō](http://mattdesl.svbtle.com/rapid-prototyping)

## usage

[![NPM](https://nodei.co/npm/budo.png)](https://www.npmjs.com/package/budo)

### CLI

Details for `budo` command-line interface. Other options (like `-t`) will be sent to browserify.

```txt
Usage:
  budo [entries] [opts]

Options:
  --help, -h       show help message
  --port           the port to run, default 9966
  --host           the host, default "localhost"
  --dir            the directory to serve, and the base for --outfile
  --serve          override the bundle path being served
  --live           enable LiveReload integration
  --live-plugin    enable LiveReload but do not inject script tag
  --live-port      the LiveReload port, default 35729
  --pushstate      always render the index page instead of a 404 page
  --verbose, -v    verbose timing information for re-bundles
  --poll=N         use polling for file watch, with optional interval N
  --no-stream      do not print messages to stdout
  --no-debug       do not use inline source maps
```

By default, messages will be printed to `process.stdout`, and `--debug` will be sent to browserify (for source maps). You can turn these off with `--no-stream` and `--no-debug`, respectively. 

Everything after `--` is passed directly to browserify; this is currently needed for subarg syntax. Example:

```js
budo index.js --live -- -t [ babelify --extensions .es6 ]
```

### API

The API mirrors the CLI except it does not write to `process.stdout` by default, and does not attempt to find available ports from a base port. 

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

See [API usage](docs/programmatic-usage.md) for more details.

## Script Injection

[![screenshot](http://i.imgur.com/LJP7d9I.png)](https://www.youtube.com/watch?v=cfgeN3G_Gl0)

<sup>[(click for demo)](https://www.youtube.com/watch?v=cfgeN3G_Gl0)</sup>

The original motivation for making budō was to build an *experimental* tool and proof-of-concept around Chrome Script Injection. This has since split off into its own repository: [budo-chrome](https://github.com/mattdesl/budo-chrome).

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/budo/blob/master/LICENSE.md) for details.
