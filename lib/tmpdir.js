// var quick = require('quick-tmp')('mystc')
var rimraf = require('rimraf')
var log = require('bole')('mystc')
var tmp = require('tmp')

module.exports = function(cb) {
    tmp.dir(function(err, filepath) {
        if (!err) {
            process.on('exit', remove)
            process.on('SIGINT', exit)
            process.on('uncaughtException', exit)
        }

        cb(err, filepath)

        function remove(err) {
            try {
              rimraf.sync(filepath)
            } catch(e) {
              rimraf.sync(filepath)
            }
            if (err) 
                console.error(err.stack)
        }

        function exit(err) {
            if (err)
                console.error(err.stack)
            process.exit()
        }
    })

}