# comparisons

## budō

[budō](https://github.com/mattdesl/budo) lies somewhere between the rich feature set of [Beefy](#beefy) and the small focus of [wzrd](#wzrd). It has a stronger focus on LiveReload and incremental bundling, suspending the server response until the bundle is complete (i.e. never serves stale bundles). It is also the base for more experimental features like [Chrome script injection](https://github.com/mattdesl/budo-chrome) and [React hot module replacement](https://github.com/milankinen/livereactload). 

## beefy

[Beefy](https://github.com/chrisdickinson/beefy) is a feature-rich dev tool for browserify, and much of the inspiration for this project. It has a wide scope, encompassing browserify and watchify, and takes a different approach to live reload.

```sh
#example ...
beefy index.js --open
```

## wzrd

[wzrd](https://github.com/maxogden/wzrd) is a tiny spin-off of beefy that is ideal for [local dependencies](https://github.com/stackgl/learning-webgl-03/blob/db8f36a534b2a184924f8b890014ff3dd9a5b391/package.json#L6-L9). It has a small and focused scope, and encourages composition and diversity with other tools (e.g. [garnish](https://github.com/mattdesl/garnish) for pretty-printing).

Incremental bundling is likely outside of its scope.

```sh
#example ...
wzrd index.js:bundle.js | garnish
```

## garnish

[garnish](https://github.com/mattdesl/garnish) simply prettifies bole and ndjson log output from tools that decide to use it. This includes wzrd, wtch, and budō.