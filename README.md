# budō

[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

[![screenshot](http://i.imgur.com/LJP7d9I.png)](https://www.youtube.com/watch?v=cfgeN3G_Gl0)

<sup>[(click for demo)](https://www.youtube.com/watch?v=cfgeN3G_Gl0)</sup>

This is a browserify development server inspired by [beefy](https://github.com/chrisdickinson/beefy) and [wzrd](https://github.com/maxogden/wzrd), but with a stronger focus on incremental bundling, LiveReload (including CSS injection), and other experimental features down the road.

Note that budo needs a copy of `watchify` installed. It can be either local (preferred) or global.

```sh
npm install budo watchify -g
```

The simplest use cases will start up a server with a default `index.html` and incrementally bundle your source on filesave. Examples:

```sh
#run watchify on port 9966
budo index.js

#run watchify with local output file 
budo index.js --outfile bundle.js --verbose

#run watchify with some options and trigger LiveReload on change
budo index.js --live --transform brfs
```

You can open `localhost:9966` to see the content in action.

To pretty-print in terminal, [garnish](https://github.com/mattdesl/garnish), [bistre](https://github.com/hughsk/bistre) or another [ndjson](ndjson.org)-based stream can be used.

```sh
budo index.js -o bundle.js | garnish
```

See [docs](#docs) for more features.

PRs/suggestions/comments welcome. Props to [@caspervonb](https://twitter.com/caspervonb) for the early groundwork.

## docs

- [basic usage](docs/basics.md)
- [experimental features](docs/experimental-features.md)
- [comparisons](docs/comparisons.md)

## usage

[![NPM](https://nodei.co/npm/budo.png)](https://www.npmjs.com/package/budo)

Details for `budo` command-line interface. Other options are sent to browserify/watchify. 

```sh
Usage:
    budo [entries] [opts]

Options:
    --outfile, -o   path to output bundle
    --port          the port to run, default 9966
    --host          the host, default "localhost"
    --dir           the directory to serve, and the base for --outfile
    --live          enable LiveReload integration
    --live-plugin   enable LiveReload but do not inject script tag
    --live-port     the LiveReload port, default 35729
```

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/budo/blob/master/LICENSE.md) for details.
