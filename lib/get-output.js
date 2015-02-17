var path = require('path')
var tmpdir = require('./tmpdir')

//get an output directory, from user or tmp dir
module.exports = function getOutput(argv, cb) {
    var output
    var outfile = argv.o || argv.outfile
    if (!outfile) {
        var to = 'bundle.js'
        tmpdir(function(err, filedir) {
            if (!err) {
                var file = path.join(filedir, to)
                output = { 
                    tmp: true, 
                    from: file, 
                    to: to, 
                    dir: filedir 
                }
            }
            cb(null, output)
        })
    } else {
        var from = path.join(argv.dir, outfile)
        output = { 
            from: from, 
            to: outfile, 
            dir: argv.dir
        }
        cb(null, output)
    }
}