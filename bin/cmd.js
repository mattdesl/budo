#!/usr/bin/env node

//Starts budo with stdout
//Handles --help and error messaging
//Uses auto port-finding

var args = process.argv.slice(2)
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
  require('../')(entries, opts)
    .on('error', function(err) {
      //Some more helpful error messaging
      if (err.message === 'listen EADDRINUSE')
        console.error("Port", port, "is not available\n")
      else
        console.error('Error:\n  ' + err.message)
      process.exit(1)
    })
})