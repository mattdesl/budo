# comparisons

## budō

[budō](https://github.com/mattdesl/budo) lies somewhere between the rich feature set of [Beefy](#beefy) and the small focus of [wzrd](#wzrd). It spawns a watchify process, produces ndjson logs, and includes some more experimental features for live-reloading, [script injection](https://github.com/mattdesl/budo-chrome), and rapid prototyping. 

## beefy

[Beefy](https://github.com/chrisdickinson/beefy) is a feature-rich dev tool for browserify, and much of the inspiration for this project. However, it currently has some shortcomings[<sup>[1]</sup>](https://github.com/chrisdickinson/beefy/issues/49)[<sup>[2]</sup>](https://github.com/chrisdickinson/beefy/issues/63) and often feels clunky to deliver as a local dependency. It also takes a different approach to bundling, by using watchify's programmatic API rather than [execspawn](https://www.npmjs.com/package/npm-execspawn). 

```sh
#example ...
beefy index.js --open
```

## wzrd

[wzrd](https://github.com/maxogden/wzrd) is a tiny spin-off of beefy that is ideal for [local dependencies](https://github.com/stackgl/learning-webgl-03/blob/db8f36a534b2a184924f8b890014ff3dd9a5b391/package.json#L6-L9). It introduces some novel ideas like entry mapping and ndjson output with tools like [garnish](https://github.com/mattdesl/garnish).

However, incremental bundling is likely outside of its scope.

```sh
#example ...
wzrd index.js:bundle.js | garnish
```

## wtch

[wtch](https://github.com/mattdesl/wtch) is a small live-reload utility that budō builds on. It watches for JS/CSS/HTML changes and triggers a live-reload event. It can be used to augment wzrd with some watching capabilities.

```sh
#example ...
wzrd index.js:bundle.js | wtch | garnish

#with watchify ...
watchify index.js -o bundle.js | wtch bundle.js | garnish
```

## garnish

[garnish](https://github.com/mattdesl/garnish) simply prettifies bole and ndjson log output from tools that decide to use it. This includes wzrd, wtch, and budō.