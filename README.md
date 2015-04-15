# budō

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

This is a browserify development server inspired by [beefy](https://github.com/chrisdickinson/beefy) and [wzrd](https://github.com/maxogden/wzrd), but specifically focused on incremental reloading and LiveReload integration (including CSS injection).

Note that budo needs a copy of `watchify` installed. It can be either local (preferred) or global.

```sh
npm install budo watchify -g
```

The simplest use cases will start up a server with a default `index.html` and incrementally bundle your source on filesave. The requests are delayed until the bundle has finished, so you won't be served stale or empty bundles if you refresh the page mid-update. Examples:

```sh
# serve file on port 9966
budo index.js

# show timing information on re-bundle
budo index.js --verbose

# transpile ES6 and trigger LiveReload on html/css/js change
budo index.js --live --transform babelify
```

Then open [http://localhost:9966](http://localhost:9966) to see the content in action.

To pretty-print in terminal, [garnish](https://github.com/mattdesl/garnish), [bistre](https://github.com/hughsk/bistre) or another [ndjson](http://ndjson.org)-based stream can be used:

```sh
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
- [rapid prototyping with budō and wzrd](http://mattdesl.svbtle.com/rapid-prototyping)

## usage

[![NPM](https://nodei.co/npm/budo.png)](https://www.npmjs.com/package/budo)

### CLI

Details for `budo` command-line interface. Other options like `--transform` are sent to browserify/watchify. 

```sh
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
  --verbose, -v    verbose timing information for re-bundles
  --poll=N         use polling for file watch, with optional interval N
  --no-stream      do not print messages to stdout
  --no-debug       do not use inline source maps
```

By default, messages will be printed to `stdout` and `debug` will be sent to browserify (for source maps). You can turn these off with `--no-stream` and `--no-debug`, respectively. 

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

The original motivation for making budō was to build a simple tool around Chrome Script Injection. This has since split off into its own repository: [budo-chrome](https://github.com/mattdesl/budo-chrome) to minimize the scope of budō. 

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/budo/blob/master/LICENSE.md) for details.
