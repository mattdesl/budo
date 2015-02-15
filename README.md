# mystc [working title]

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

<sup>"mystic" - working title</sup>

This is a browserify development server inspired by [beefy](https://github.com/chrisdickinson/beefy) and [wzrd](https://github.com/maxogden/wzrd), but with a stronger focus on incremental bundling, LiveReload (including CSS injection), and "script injection" (Chrome only).

Note that mystc needs a copy of `watchify` installed. It can be either local (preferred) or global.

```sh
npm install mystc watchify -g
```

Simple uses: 

```sh
#run watchify on port 8000
mystc index.js -o bundle.js --port 8000

#run watchify and trigger LiveReload events on update
mystc index.js -o bundle.js --live
```

To pretty-print in terminal, [garnish](https://github.com/mattdesl/garnish), [bistre](https://github.com/hughsk/bistre) or another [ndjson](ndjson.org)-based stream can be used.

```sh
mystc index.js -o bundle.js | garnish --level debug
```

More docs to come soon, including the "script injection" in Chrome and other experimental features.

This is still highly experimental, and so far only tested on OSX. PRs/suggestions/comments welcome. Props to [@caspervonb](https://twitter.com/caspervonb) for the early groundwork.

## Usage

[![NPM](https://nodei.co/npm/mystc.png)](https://www.npmjs.com/package/mystc)

Coming soon.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/mystc/blob/master/LICENSE.md) for details.
