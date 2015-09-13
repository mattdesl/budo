var parseArgs = require('./lib/parse-args')
var budo = require('./lib/budo')
var color = require('term-color')

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
  }

  // opts.live can be a glob or a boolean
  if (typeof argv.live === 'string' && /(true|false)/.test(argv.live)) {
    argv.live = argv.live === 'true'
  }

  return budo(entries, argv).on('error', exit)
}

function exit (err) {
  console.log(color.red('ERROR'), err.message)
  process.exit(1)
}
