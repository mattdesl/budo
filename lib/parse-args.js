var subarg = require('subarg')
var xtend = require('xtend')

module.exports = parseArgs
function parseArgs (args, opt) {
  // before parsing subarg, remove the bundler arguments
  var bundlerFlags = []
  var stopIndex = args.indexOf('--')
  if (stopIndex >= 0) {
    bundlerFlags = args.slice(stopIndex + 1)
    args = args.slice(0, stopIndex)
  }
  var argv = subarg(args, {
    boolean: [
      'stream',
      'debug',
      'errorHandler',
      'forceDefaultIndex',
      'open',
      'portfind',
      'ndjson',
      'verbose',
      'cors',
      'ssl'
    ],
    string: [
      'host',
      'port',
      'dir',
      'onupdate',
      'serve',
      'title',
      'watchGlob',
      'cert',
      'key'
    ],
    default: module.exports.defaults,
    alias: {
      port: 'p',
      ssl: 'S',
      serve: 's',
      cert: 'C',
      key: 'K',
      verbose: 'v',
      help: 'h',
      host: 'H',
      dir: 'd',
      live: 'l',
      open: 'o',
      staticOptions: [ 'static-options' ],
      watchGlob: [ 'wg', 'watch-glob' ],
      errorHandler: 'error-handler',
      forceDefaultIndex: 'force-default-index',
      pushstate: 'P'
    },
    '--': true
  })
  // add back in the bundler flags
  argv['--'] = bundlerFlags
  return xtend(argv, opt)
}

module.exports.defaults = {
  title: 'budo',
  port: 9966,
  debug: true,
  stream: true,
  errorHandler: true,
  portfind: true
}
