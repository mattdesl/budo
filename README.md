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
budo index.js -o bundle.js
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

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/budo/blob/master/LICENSE.md) for details.
