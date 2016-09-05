'use strict'

const parseArgs = require('./lib/parse-args')
const budo = require('./lib/budo')
const color = require('term-color')
const stdout = require('stdout-stream')
const exec = require('child_process').exec

const execFunc = (cmd) => () => {
  const p = exec(cmd)
  p.stderr.pipe(process.stderr)
  p.stdout.pipe(process.stdout)
}

const exit = (err) => {
  console.log(color.red('ERROR'), err.message)
  process.exit(1)
}

const budoCLI = (args, opts) => {
  const argv = parseArgs(args, opts)
  // if no stream is specified, default to stdout
  if (argv.stream !== false) {
    argv.stream = stdout
  }

  const entries = argv._
  delete argv._

  argv.browserifyArgs = argv['--']
  delete argv['--']

  if (argv.version) {
    console.log(`budo v ${require('./package.json').version}`)
    console.log(`browserify v ${require('browserify/package.json').version}`)
    console.log(`watchify v ${require('watchify-middleware').getWatchifyVersion()}`)
    return null
  }

  if (argv.help) {
    const help = require('path').join(__dirname, 'bin', 'help.txt')
    require('fs').createReadStream(help)
      .pipe(process.stdout)
    return null
  }

  if (argv.outfile) {
    console.error(color.yellow('WARNING'), '--outfile has been removed in budo@3.0')
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
  const instance = budo(entries, argv).on('error', exit)
  const onUpdates = [].concat(argv.onupdate).filter(Boolean)
  onUpdates.forEach((cmd) => {
    instance.on('update', execFunc(cmd))
  })

  return instance
}

module.exports = budo
module.exports.cli = budoCLI
