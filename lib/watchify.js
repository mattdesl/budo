
var path = require('path')
var resolve = require('resolve')
var getModule = require('./get-module')

module.exports = function(opt) {
  getModule('watchify', { basedir: opt.dir }, function(err, result) {
    if (err) 
      console.error(err)
    else
      console.error("SUCCESS", result)
    process.exit(1)
  })  
  // var dir = __dirname
  // var watchify = require(dir)

  // resolve('browserify/bin/args.js', { basedir: dir }, onmodule)

  function onmodule(err, browserifyModule) {
    if(err) {
      console.error("ERROR RESOLVING", err)
    }

    console.error("SUCCESS", browserifyModule)

    process.exit(1)

    // var parseArgs = require(browserifyModule)
    // var watcher = watchify(parseArgs([entry].concat(flags)))
  }
}




/*
var spawn = require('npm-execspawn')
var quote = require('shell-quote').quote

//Runs watchify with given args, returns process
module.exports = function(watchifyArgs) {
  var cmd = ['watchify']
    .concat(quote(watchifyArgs || []))
    .join(' ')

  var proc = spawn(cmd)
  proc.stderr.on('data', function(err) {
    //nicer messaging for common error cases
    if (err.toString().indexOf('watchify: command not found') >= 0) {
      process.stderr.write("ERROR: Could not find watchify\n")
      process.stderr.write("Make sure to install it locally with --save-dev\n")
    } else 
      process.stderr.write(err.toString())
  })

  var hasClosed = false
  process.on('close', handleClose)
  process.on('exit', handleClose)

  return proc

  function handleClose() {
    if (hasClosed) return
    hasClosed = true
    proc.kill()
  }
}*/