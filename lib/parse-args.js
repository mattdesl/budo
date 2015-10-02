var minimist = require('minimist')
var xtend = require('xtend')

module.exports = parseArgs
function parseArgs (args, opt) {
  var argv = minimist(args, {
    boolean: [
      'stream',
      'debug',
      'errorHandler',
      'live',
      'open',
      'portfind'
    ],
    string: [
      'host',
      'port',
      'dir',
      'onupdate',
      'serve'
    ],
    default: {
      port: 9966,
      debug: true,
      stream: true,
      errorHandler: true,
      portfind: true
    },
    alias: {
      port: 'p',
      help: 'h',
      host: 'H',
      dir: 'd',
      live: 'l',
      open: 'o',
      errorHandler: 'error-handler',
      'live-port': ['L', 'livePort'],
      pushstate: 'P'
    },
    '--': true
  })
  return xtend(argv, opt)
}
