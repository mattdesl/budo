var path = require('path')
var tmpdir = require('./tmpdir')

//get an output directory, from user or tmp dir
module.exports = function getOutput(argv, cb) {
    var outfile = argv.o || argv.outfile
    if (!outfile) {
        var to = 'bundle.js'
        tmpdir(function(err, filedir) {
            var output
            if (!err) {
                var file = path.join(filedir, to)
                output = { 
                    tmp: true, 
                    from: file, 
                    to: to, 
                    dir: filedir 
                }
            }
            cb(err, output)
        })
    } else {
        var from = path.join(argv.dir, outfile)
        cb(null, { 
            from: from, 
            to: outfile, 
            dir: argv.dir
        })
    }
}