var parseArgs = require('./lib/parse-args')
var budo = require('./lib/budo')
var color = require('kolorist')
var stdoutStream = require('stdout-stream')
var exec = require('child_process').exec

module.exports = budo
module.exports.cli = budoCLI

function budoCLI (args, opts) {
  var argv = parseArgs(args, opts)

  // if no stream is specified, default to stdout
  if (argv.stream !== false) {
    argv.stream = /^win/.test(process.platform) ? process.stdout : stdoutStream
  }

  var entries = argv._
  delete argv._

  argv.browserifyArgs = argv['--']
  delete argv['--']

  if (argv.version) {
    console.log('budo v' + require('./package.json').version)
    console.log('browserify v' + require('browserify/package.json').version)
    console.log('watchify v' + require('watchify/package.json').version)
    return null
  }

  if (argv.help) {
    var help = require('path').join(__dirname, 'bin', 'help.txt')
    require('fs').createReadStream(help)
      .pipe(process.stdout)
    return null
  }

  if (argv.outfile) {
    console.error(color.yellow('WARNING'), '--outfile has been removed in budo@3.0')
  }

  if (typeof argv.pushstate === 'string') {
    // support backwards compatibility with CLI like this:
    //    budo -P index.js:bundle.js
    var newEntry = argv.pushstate
    argv.pushstate = argv.P = true
    entries.unshift(newEntry)
    console.error(color.yellow('WARNING'), '\nAs of budo@10.x, --pushstate should come ' +
        'after your JS entries.\nExample:\n' +
        '  budo index.js:bundle.js --pushstate')
  }

  if (typeof argv.port === 'string') {
    argv.port = parseInt(argv.port, 10)
  }
  if (typeof argv.livePort === 'string') {
    argv.livePort = parseInt(argv.livePort, 10)
  }

  // opts.live can be a glob or a boolean
  if (typeof argv.live === 'string' && /(true|false)/.test(argv.live)) {
    argv.live = argv.live === 'true'
  }

  // CLI only option for executing a child process
  var instance = budo(entries, argv).on('error', exit)
  var onUpdates = [].concat(argv.onupdate).filter(Boolean)
  onUpdates.forEach(function (cmd) {
    instance.on('update', execFunc(cmd))
  })

  return instance
}

function execFunc (cmd) {
  return function run () {
    var p = exec(cmd)
    p.stderr.pipe(process.stderr)
    p.stdout.pipe(process.stdout)
  }
}

function exit (err) {
  console.log(color.red('ERROR'), err.message)
  process.exit(1)
}
