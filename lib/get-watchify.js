var resolve = require('resolve')
var getModule = require('./get-module')

//finds watchify/bin/args.js local or global
module.exports = function getWatchify(opt, cb) {
  if (typeof opt === 'function') {
    cb = opt
    opt = { basedir: process.cwd() }
  }
  getModule('watchify', opt, function(err, result) {
    if (err) 
      return cb(err)

    resolve('watchify/bin/args.js', { basedir: result }, resolved)  
    function resolved(err, watchifyModule) {
      if (err)
        return cb(err)
      var fromArgs = require(watchifyModule)
      cb(null, fromArgs)
    }
  })
}