var resolve = require('resolve')
var getModule = require('resolve-npm-which')

//finds watchify/bin/args.js local or global
module.exports = function getWatchify(opt, cb) {
  if (typeof opt === 'function') {
    cb = opt
    opt = { basedir: process.cwd() }
  }
  getModule('watchify', opt, function(err, result) {
    if (err) 
      return cb(err)

    //Once we get watchify path, grab its bin/args.js
    resolve('./bin/args.js', { basedir: result }, function(err, watchifyModule) {
      if (err)
        return cb(new Error('could not find watchify/bin/args.js - unsupported watchify version'))
      var fromArgs = require(watchifyModule)
      cb(null, fromArgs)
    })
  })
}