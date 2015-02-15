# budō

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

[![screenshot](http://i.imgur.com/LJP7d9I.png)](https://www.youtube.com/watch?v=cfgeN3G_Gl0)

<sup>[(click for demo)](https://www.youtube.com/watch?v=cfgeN3G_Gl0)</sup>

This is a browserify development server inspired by [beefy](https://github.com/chrisdickinson/beefy) and [wzrd](https://github.com/maxogden/wzrd), but with a stronger focus on incremental bundling, LiveReload (including CSS injection), and JavaScript injection (Chrome only).

Note that budo needs a copy of `watchify` installed. It can be either local (preferred) or global.

```sh
npm install budo watchify -g
```

Simple use, which builds to `bundle.js` on filesave:

```sh
#run watchify on port 9966
budo index.js --outfile bundle.js --verbose
```

Now open `localhost:9966` to see the content in action.

To pretty-print in terminal, [garnish](https://github.com/mattdesl/garnish), [bistre](https://github.com/hughsk/bistre) or another [ndjson](ndjson.org)-based stream can be used.

```sh
budo index.js -o bundle.js | garnish
```

See [docs](#docs) for more features including Chrome script injection.

This is still highly experimental, and so far only tested on OSX. PRs/suggestions/comments welcome. Props to [@caspervonb](https://twitter.com/caspervonb) for the early groundwork.

## docs

- [basic usage](docs/basics.md)
- [experimental features](docs/experimental-features.md)
- [comparisons](docs/comparisons.md)

## usage

Details for `budo` command-line interface. Aside from the following options, all others are sent to browserify/watchify.

```sh
Usage:
    budo [entries] [opts]

Options:
    --outfile, -o   path to output bundle
    --port          the port to run, default 9966
    --live          enable LiveReload integration
```

Installing budo also comes with a `budo-chrome` binary for script injection. It is still [experimental](docs/experimental-features.md). 

```sh
Usage:
    budo-chrome [entries] [opts]

Options:
    --outfile, -o   path to output bundle
    --open          open a new instance of Chrome
    --port          port to serve content, default 9966
    --remote-port   remote debugging port, default 9222
```

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/budo/blob/master/LICENSE.md) for details.
