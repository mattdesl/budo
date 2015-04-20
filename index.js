var create = require('./lib')

//public programmatic API
// expects args to be camelCase
// supports objects in transforms
module.exports = function budo(entry, opt) {
  return create(entry, opt, false)
}

//CLI entry point (undocumented, private for now)
// uses watchify/bin/args to arg parse
// does not support objects in transforms
// uses portfinding on base port
// prints to stdout
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


function isSubargError(args) {
  var end = args.indexOf('--')
  if (end === -1)
    end = Number.MAX_VALUE
  var sub1 = args.indexOf('[')
  var sub2 = args.indexOf(']')
  return (sub1 >= 0 && sub1 < end) || (sub2 >= 0 && sub2 < end)
}