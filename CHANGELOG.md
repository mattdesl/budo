# 5.0.0

##### Major Changes

- the `<script>` src defaults to the *filename* of the first entry
  - eg: `budo src/index.js` leads to `<script src="index.js">`
- browserify options must come after a full stop `--`
  - except `--no-debug` which is passed as a budo option
  - eg: `budo index.js --no-debug -- -t babelify`
- `--dir` can be passed multiple times to use multiple static folders
  - `budo index.js --dir public --dir tmp`
- removed `--live-plugin` option to reduce code complexity
- portfinding is enabled by default in API and CLI
  - user can disbale with `--no-portfind` or `portfind: false`
- removed `--verbose`, `-v`, timing is logged by default now
- added `--open`, `-o` to launch browser on connect
- DOM error handling is enabled by default 
  - can use `--no-error-handler` or `errorHandler: Boolean|Function`
- added `--version` to CLI
- `--live` can optionally be a string to only LiveReload on those globs, eg:
  - `budo index.js --live=*.{css,html}`
- removed `--ignore-watch` and `--interval`
  - use `budo.watch(glob, chokidarOpts)` instead
- shorthand for most options now exists
- arg parsing has improved, so you can run most args first:
  - `budo --live src/index.js`
- improved error messaging in terminal

##### API Changes

- `dir` can be a string or array of static paths
- the `'connect'` event now passes `livePort`
- exposed a CLI feature
  - `require('budo').cli(process.argv.slice(2), { overrides... })`
- `errorHandler` can be used for custom bundle error handling
- `middleware` can be a `fn(req, res, next)` function for custom routes
  
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
