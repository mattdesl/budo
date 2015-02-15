# mystc

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

<sup>"mystic"</sup>

This is a browserify development server inspired by [beefy](https://github.com/chrisdickinson/beefy) and [wzrd](https://github.com/maxogden/wzrd), but with a stronger focus on incremental bundling, LiveReload, and "script injection" (Chrome only).

Note that mystc needs a copy of `browserify` installed. It can be either local (preferred) or global.

```sh
npm install mystc browserify -g
```

Simple uses: 

```sh
#run watchify on port 8000
mystc index.js --port 8000

#run watchify and trigger LiveReload events on update
mystc index.js --live
```

To pretty-print in terminal, [garnish](https://github.com/mattdesl/garnish), [bistre](https://github.com/hughsk/bistre) or another [ndjson](ndjson.org)-based stream can be used.

```sh
mystc index.js | garnish --level debug
```

This is still experimental, and so far only tested on OSX. PRs/suggestions/comments welcome. Props to [@caspervonb](https://twitter.com/caspervonb) for the early groundwork.

## Usage

[![NPM](https://nodei.co/npm/mystc.png)](https://www.npmjs.com/package/mystc)

Coming soon.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/mystc/blob/master/LICENSE.md) for details.
