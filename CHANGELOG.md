# 11.x

#### Breaking Changes

- Upgraded to `browserify@15`, set supported node version to `>= 4`

# 10.x

:tada:

#### Breaking Changes

- Upgraded to `browserify@14`
- The `--pushstate` boolean argument should now come *after* entries in the CLI, as it supports subarg options. Using it before entries will still work but may log a warning.
- Major overhaul to LiveReload backend to make it faster and more robust [#194](https://github.com/mattdesl/budo/issues/194)
  - No longer uses `tiny-lr` or the old school LiveReload stuff, so it no longer supports some of the feature set from that tool
  - No longer supports the LiveReload browser plugin
  - Budo runs everything on a single port/server instead of a second server for LiveReload
  - `/budo/livereload.js` now serves the LiveReload client

#### Other Changes

- `opts.staticOptions` is now passed onto `serve-static` module
- `opts.pushstate` (boolean or object) is now passed onto `connect-pushstate` module
- CLI now supports subarg syntax for commands like `--static-options` and `--pushstate`
- `defaultIndex` function now accepts a `req` as the second parameter

# 9.4.7

- Make HTTP logging more accurate: previously the time and byte size was not correct

# 9.4.5 .. 9.4.6

- Small tweaks to frontend build error styling
- Add `pushstate` flag as a boolean so it doesn't swallow entry

# 9.4.3

- Disable cache control for `serve-static`, I've found this greatly reduces load time
- Slight change to `package.json` scripts so they work on Windows

# 9.4.2

- Improve Windows terminal color support, fixes [#179](https://github.com/mattdesl/budo/issues/179)

# 9.4.0

- Improve build error parsing and rendering

# 9.3.0

- Add `force-default-index` to CLI [#188](https://github.com/mattdesl/budo/pull/188)

# 9.2.2

- Minimize XSS risks in URLs on 404 [#182](https://github.com/mattdesl/budo/pull/183)

# 9.2.0

- Improved `--cors` flag in middleware stack [#172](https://github.com/mattdesl/budo/pull/172)

# 9.1.0

- Support `browserify: { entries: [] }` in API options [#167](https://github.com/mattdesl/budo/pull/167)
- The `connect` event also returns a `server` instance, so you can use it with things like SocketIO

# 9.0.0

When `--ssl` is specified without a `--cert` and `--key` option, budo will use [pem](https://www.npmjs.com/package/pem) to generate a self-signed certificate. This is a breaking change from previous versions, but more convenient for most users.

Also updated docs with more SSL info.

# 8.4.0

Add `--base` flag for working with push state servers.

# 8.3.0

Bump to latest browserify.

# 8.2.2

Fix shorthand for `--serve` (`-s`).

# 8.2.0

Add support for SSL (HTTPS) with `--ssl`, `--cert` and `--key` options.

# 8.1.0

Add `--cors` flag to enable `Access-Control-Allow-Origin: *`

# 8.0.4

Bump required deps.

# 8.0.3

Fix `opts.live` as a string, allowing an array of options to be passed to filter file names.

# 8.0.2

Fix flow so that bundling events start after server connects, also updated upstream in watchify-middleware.

# 8.0.1

Fix parsing issue with LiveReload resp modifier.

# 8.0.0

The server code has been refactored to use connect/express-style middleware stacking. Fixes [#80](https://github.com/mattdesl/budo/issues/80), [#79](https://github.com/mattdesl/budo/issues/79), [#124](https://github.com/mattdesl/budo/issues/124), [#128](https://github.com/mattdesl/budo/issues/128).

##### Major Changes

Functions for `opts.middleware` now assumes the following signature, and will not behave differently based on the number of arguments you specify:

  - `middleware(req, res, next)`

##### Minor Changes

The `middleware` options can now be an array of functions, or a single function.

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
