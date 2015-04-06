### version 3.0 roadmap

[See here](https://github.com/mattdesl/budo/issues/20#issuecomment-89889926) the budo@3.0 plans. The next version will be snappier and will never serve you stale or empty bundles (i.e. reloading page mid-compilation), but comes with some breaking changes.

# budō

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

This is a browserify development server inspired by [beefy](https://github.com/chrisdickinson/beefy) and [wzrd](https://github.com/maxogden/wzrd), but with a stronger focus on incremental bundling, LiveReload (including CSS injection), and other [experimental features](#script-injection) down the road.

Note that budo needs a copy of `watchify` installed. It can be either local (preferred) or global.

```sh
npm install budo watchify -g
```

The simplest use cases will start up a server with a default `index.html` and incrementally bundle your source on filesave. Examples:

```sh
#run watchify on port 9966
budo index.js

#run watchify with some options and trigger LiveReload on change
budo index.js --live --transform brfs
```

You can open `localhost:9966` to see the content in action.

To pretty-print in terminal, [garnish](https://github.com/mattdesl/garnish), [bistre](https://github.com/hughsk/bistre) or another [ndjson](http://ndjson.org)-based stream can be used.

```sh
budo index.js -o bundle.js | garnish
```

See [docs](#docs) for more features.

PRs/suggestions/comments welcome. Props to [@caspervonb](https://twitter.com/caspervonb) for the early groundwork.

## docs

- [basic usage](docs/basics.md)
- [comparisons](docs/comparisons.md)
- [programmatic usage (Gulp, Grunt)](docs/programmatic-usage.md)
- [error reporting](docs/errors.md)
- [running tests and examples](docs/tests-and-examples.md)
- [script injection with budo-chrome](https://github.com/mattdesl/budo-chrome)
- [rapid prototyping with budō and wzrd](http://mattdesl.svbtle.com/rapid-prototyping)

## usage

[![NPM](https://nodei.co/npm/budo.png)](https://www.npmjs.com/package/budo)

### CLI

Details for `budo` command-line interface. Other options like `--verbose` and `--transform` are sent to browserify/watchify. 

```sh
Usage:
    budo [entries] [opts]

Options:
    --help, -h      show help message
    --outfile, -o   path to output bundle
    --port          the port to run, default 9966
    --host          the host, default "localhost"
    --dir           the directory to serve, and the base for --outfile
    --live          enable LiveReload integration with a script tag
    --live-plugin   enable LiveReload for use with a browser plugin
    --live-port     the LiveReload port, default 35729
```

By default, the `--debug` option will be sent to watchify (for source maps). If this is unwanted, you can use `--no-debug` or `--debug=false` to disable source maps.

*Note:* The `--outfile` is relative to the specified `--dir`. 

### API

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

See [API usage](docs/programmatic-usage.md) for more details.

## Script Injection

[![screenshot](http://i.imgur.com/LJP7d9I.png)](https://www.youtube.com/watch?v=cfgeN3G_Gl0)

<sup>[(click for demo)](https://www.youtube.com/watch?v=cfgeN3G_Gl0)</sup>

The original motivation for making budō was to build a simple tool around Chrome Script Injection. This has since split off into its own repository: [budo-chrome](https://github.com/mattdesl/budo-chrome) to minimize the scope of budō. 

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/budo/blob/master/LICENSE.md) for details.
