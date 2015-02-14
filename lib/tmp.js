/*
Unfortunately tmp file arg is not working with 
watchify on OSX due to "ENONET" error with ".bundle.js"
 */

var quick = require('quick-tmp')('mystc')
var rimraf = require('rimraf')
var log = require('bole')('mystc')

module.exports = function() {
    var filepath = quick()

    log.debug('created tempdir at', filepath)
    process.on('exit', remove)
    process.on('SIGINT', exit)
    process.on('uncaughtException', exit)
    return filepath

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
}