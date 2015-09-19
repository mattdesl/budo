var parseArgs = require('./lib/parse-args')
var budo = require('./lib/budo')
var color = require('term-color')
var exec = require('child_process').exec

module.exports = budo
module.exports.cli = budoCLI

function budoCLI (args, opts) {
  var argv = parseArgs(args, opts)

  // default to stdout
  if (argv.stream !== false) {
    argv.stream = process.stdout
  }

  var entries = argv._
  delete argv._

  argv.browserifyArgs = argv['--']
  delete argv['--']

  if (argv.version) {
    console.log(require('./package.json').version)
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
    // ensure we don't pass to watchify
    delete argv.outfile
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
  
  // this feature is experimental and may be subject to removal
  var onErrors = [].concat(argv.onerror).filter(Boolean)
  onErrors.forEach(function (cmd) {
    instance.on('bundle-error', execFunc(cmd, true))
  })
  
  return instance
}

function execFunc (cmd, isErr) {
  return function run (err) {
    var p = exec(cmd)
    p.stderr.pipe(process.stderr)
    p.stdout.pipe(process.stdout)
    if (isErr && err && err.message) {
      p.stdin.write(err.message.trim() + '\n')
      p.stdin.end()
    }
  }
}

function exit (err) {
  console.log(color.red('ERROR'), err.message)
  process.exit(1)
}
