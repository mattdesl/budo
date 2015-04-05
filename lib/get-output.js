var path = require('path')
var tmpdir = require('./tmpdir')
var quote = require('shell-quote')

//get an output directory, from user or tmp dir
module.exports = function getOutput(argv, cb) {
  var outfile = argv.o || argv.outfile
  var from

  //outpipe was added in watchify@3.1.0
  if (outfile.indexOf('|') >= 0 || outfile.indexOf('>') >= 0) {
    var err = new Error("unsupported outpipe command")
    err.name = 'OUTPIPE'
    return cb(err)
  } else {
    from = path.join(argv.dir, outfile)
  }

  return {
    from: from,
    to: outfile,
    outpipe: outpipe,
    dir: argv.dir
  }
}