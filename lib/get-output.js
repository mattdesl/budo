var path = require('path')
var tmpdir = require('./tmpdir')
var quote = require('shell-quote')

//get an output directory, from user or tmp dir
module.exports = function getOutput(argv, cb) {
  var outfile = argv.o || argv.outfile
  if (!outfile) {
    //user can specify a mapping for temp dirs
    var bundleTo = argv.__to || 'bundle.js'

    tmpdir(function(err, filedir) {
      var output
      if (!err) {
        var file = path.join(filedir, bundleTo)
        output = {
          tmp: true,
          from: file,
          to: bundleTo,
          dir: filedir
        }
      }
      cb(err, output)
    })
  } else {
    var outpipe = null
    var from

    //outpipe was added in watchify@3.1.0
    if (outfile.indexOf('|') >= 0 || outfile.indexOf('>') >= 0) {
      var err = new Error("unsupported outpipe command")
      err.name = 'OUTPIPE'
      return cb(err)
    } else {
      from = path.join(argv.dir, outfile)
    }

    cb(null, {
      from: from,
      to: outfile,
      outpipe: outpipe,
      dir: argv.dir
    })
  }
}