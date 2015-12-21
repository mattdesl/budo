# 7.1.0

Added `--watch-glob` option which allows you to override the default watch glob without having to go through the `live()` / `watch()` API

# 7.0.4

Small patch [#117](https://github.com/mattdesl/budo/pull/117) to fix a failing test in 7.0.3.

# 7.0.3

- Bole no longer double-logs on shut-down and re-start.
- Fixed issue with request sizes being logged incorrectly in terminal

# 7.0.1 .. 7.0.2

Small patches for [#110](https://github.com/mattdesl/budo/pull/110) and [#111](https://github.com/mattdesl/budo/pull/111).

# 7.0.0

Fixes previous patch and also updates to garnish redesign, leading to new log styles. 

Since various ndjson flags have changed, this is a potentially breaking change.

Also added a `--verbose` / `-v` option like watchify, which adds some additional debug messages.

# 6.1.1

Fixes live reload for directory routes like `localhost:9966/mydir`.

# 6.1.0

Search for `index.html` across all static `--dir` folders, finding the first one.

# 6.0.0

##### Major Changes

- `garnish` is now included by default in CLI and API
  - you can use `--ndjson` and `ndjson: true` to have raw output (for custom pretty-printers)

##### Minor Changes

- added `--title` option for the default HTML title
- added `--css` option for a default style sheet

# 5.0.0

##### Major Changes

- you can just type `budo . | garnish` for the entry point (or `index.js`)
- added `--onupdate` for things like linting, see [the docs](docs/command-line-usage.md#--onupdate)
- if no `--host` is specified, resolves to internal IP
  - you can still hit `localhost:9966` and it will work
- the `<script>` src defaults to the *filename* of the first entry
  - eg: `budo src/index.js` leads to `<script src="index.js">`
- browserify options must come after a full stop `--`
  - except `--no-debug` which is passed as a budo option
  - eg: `budo index.js --no-debug -- -t babelify`
- `--dir` can be passed multiple times to use multiple static folders
  - `budo index.js --dir public --dir tmp`
- removed `--live-plugin` option to reduce code complexity
  - might be added back into CLI later
  - API still supports `budo.live({ plugin: true })`
- portfinding is enabled by default in API and CLI
  - user can disbale with `--no-portfind` or `portfind: false`
- removed `--verbose`, `-v`, timing is logged by default now
- entry files are now optional (i.e. if you just need a static HTML with LiveReload)
- added `--open`, `-o` to launch browser on connect
- syntax errors in code are shown in the DOM body now
  - can disable with `--no-error-handler` 
  - in API can use `errorHandler: Boolean|Function`
- added `--version` to CLI
- `--live` can optionally be a string to only LiveReload on those globs, eg:
  - `budo index.js --live=*.{css,html}`
- removed `--ignore-watch` and `--interval`
  - use `budo.watch(glob, chokidarOpts)` instead
- shorthand for most CLI options now exists
- arg parsing has improved and uses camel-case in API
- most args are now supported before entries, eg:
  - `budo --live src/index.js`
- cleaner error messaging in terminal

##### API Changes

- `dir` can be a string or array of static paths
- the `'connect'` event now passes `livePort`
- the `'connect'` event `ev.host` now uses internal IP by default
- exposed a CLI feature
  - `require('budo').cli(process.argv.slice(2), { overrides... })`
- `errorHandler` can be used for custom bundle error handling
- `middleware` can be a `fn(req, res, next)` function for custom routes
- `'update'` event now passes `(contents, updates)`

##### Browserify Args

Users creating CLI tools on top of budo can use `opt.browserifyArgs` to handle subarg correctly. Example with minimist:

```js
var args = process.argv.slice(2)
var opts = require('minimist')(args, { '--': true })
budo.cli(args, {
  browserifyArgs: opts['--']
})
```

If no `browserifyArgs` is specified, then `opt.browserify` can be used to send the actual JS object to the browserify constructor.

```js
budo.cli(args, {
  browserify: {
    transform: require('babelify')
  }
})
```

# 4.2.0

- Added `--pushstate` option [#53](https://github.com/mattdesl/budo/pull/53)

# 4.1.0

- Fixed a bug with `budo ./foo.js`
