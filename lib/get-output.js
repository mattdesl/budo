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
    var from = path.join(argv.dir, outfile)

    //support outpipe in watchify@3.1.0
    if (outfile.indexOf('|') >= 0 || outfile.indexOf('>') >= 0) {
      var parts = quote.parse(outfile)
      var op = indexOfOp(parts)
      if (op === -1 || op === parts.length-1) {
        var err = new Error("outpipe not supported")
        err.name = 'OUTPIPE'
        return cb(err)
      }
      from = path.join(argv.dir, parts[op+1].trim())

      parts = parts.map(function(part, i) {
        if (part.op)
          return part.op
        if (i === op+1)
          return from
        return part
      })
      outpipe = quote.quote(parts)
    }

    cb(null, {
      from: from,
      to: outfile,
      outpipe: outpipe,
      dir: argv.dir
    })
  }
}

function indexOfOp(parts) {
  var i = 0
  for (; i < parts.length; i++) {
      if (parts[i].op) 
        break
  }
  return i === parts.length ? -1 : i
}