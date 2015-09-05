var parseArgs = require('./lib/parse-args')
var budo = require('./lib/create-budo')
var color = require('term-color')

module.exports = budo
module.exports.cli = budoCLI

function budoCLI (args, opts) {
  var argv = parseArgs(args, opts)

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

  if (argv.o || argv.outfile) {
    console.error(color.yellow('WARNING'), '--outfile has been removed in budo@3.0')
    // ensure we don't pass to watchify
    delete argv.o
    delete argv.outfile
  }

  return budo(entries, argv).on('error', exit)
}

function exit (err) {
  console.log(color.red('ERROR'), err.message)
  process.exit(1)
}

/*
module.exports.cli = function cli(args) {
  var getport = require('getport')
  var opts = require('minimist')(args, {
    boolean: ['stream'],
    default: { stream: true },
    '--': true
  })

  if (isSubargError(args)) {
    console.error("ERROR: You must use -- for browserify's subarg syntax")
    console.error("Example:\n  budo index.js -- -t [ babelify --extensions .babel ]")
    process.exit(1)
  }

  //user can silent budo with --no-stream
  if (opts.stream !== false) {
    opts.stream = process.stdout
  }

  var entries = opts._
  delete opts._
  
  var showHelp = opts.h || opts.help

  if (showHelp) {
    var vers = require('./package.json').version
    console.log('budo ' + vers, '\n')
    var help = require('path').join(__dirname, 'bin', 'help.txt')
    require('fs').createReadStream(help)
      .pipe(process.stdout)
    return
  }

  if (!entries || entries.filter(Boolean).length === 0) {
    console.error('ERROR:\n  no entry scripts specified\n  use --help for examples')
    process.exit(1)
  }

  var basePort = opts.port || 9966
  getport(basePort, function(err, port) {
    if (err) {
      console.error("Could not find available port", err)
      process.exit(1)
    }
    opts.port = port
    create(entries, opts, true)
      .on('error', function(err) {
        //Some more helpful error messaging
        if (err.message === 'listen EADDRINUSE')
          console.error("Port", port, "is not available\n")
        else
          console.error('Error:\n  ' + err.message)
        process.exit(1)
      })
  })
}
*/
