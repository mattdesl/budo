var create = require('./lib')

//public programmatic API
// passes camel case to browserify
// also supports objects for transform etc
module.exports = create

//CLI API (undocumented, private for now)
// uses watchify/bin/args to parse dash-case
// only expects strings for transform etc
// also prints to stdout by default, and
// uses portfinder after base port is taken
module.exports.cli = function cli(args) {
  var getport = require('getport')
  var opts = require('minimist')(args, {
    boolean: ['stream', 'debug'],
    default: { stream: true, debug: true }
  })

  //user can silent budo with --no-stream
  if (opts.stream !== false) {
    opts.stream = process.stdout
  }

  var entries = opts._
  delete opts._
  
  var showHelp = opts.h || opts.help

  if (!showHelp && (!entries || entries.filter(Boolean).length === 0)) {
    console.error('ERROR:\n  no entry scripts specified\n  use --help for examples')
    process.exit(1)
  }

  if (showHelp) {
    var vers = require('../package.json').version
    console.log('budo ' + vers, '\n')
    var help = require('path').join(__dirname, 'help.txt')
    require('fs').createReadStream(help)
      .pipe(process.stdout)
    return
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