//finds a module by name
var find = require('find-global-packages')
var resolve = require('resolve')
var path = require('path')
var which = require('npm-which')
var fs = require('fs')
var findParent = require('find-parent-dir')

//searches local first, then global
module.exports = function(name, opt, cb) {
  resolve(name, opt, function (err, result) {
    if (err)
      find(onGlobals)
    else 
      cb(null, path.dirname(result))
  })

  function onGlobals(err, dirs) {
    if (err) //problem finding globals
      return npmWhich()

    var results = dirs.filter(function(dir) {
      return path.basename(dir) === name
    })

    if (results.length === 0) {
      return npmWhich()
    } else
      return cb(null, results[0])
  }

  function npmWhich() {
    //last resort, e.g. /Users/username/npm/bin/watchify
    which(opt.basedir)(name, function(err, bin) {
      if (err) return cb(err)
      //assume symlink, get real target
      fs.realpath(bin, function(err, link) {
        if (err) 
          return cb(bail())

        //walk upward until we hit the folder by name
        var binPath = getBinPath(link)
        if (binPath)
          return cb(null, binPath)
        return cb(bail())
      })
    })
  }

  function getBinPath(file) {
    var found, 
      last
    while (file !== last) {
      var base = path.basename(file)
      if (base === 'node_modules') 
        break
      if (base === name) {
        found = file
        break
      }
      last = file
      file = path.resolve(file, '..')
    }
    return found
  }

  function bail() {
    return new Error('"'+name+'" is not installed globally or locally')
  }
}
