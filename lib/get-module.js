//finds a module by name
var find = require('find-global-packages')
var resolve = require('resolve')
var path = require('path')

//searches local first, then global
module.exports = function(name, opt, cb) {
  resolve(name, opt, function (err, result) {
    if (err)
      find(onGlobals)
    else 
      cb(null, path.dirname(result))
  })

  function onGlobals(err, dirs) {
    if (err)
      return cb(new Error('could not find module "'+name+'"'))

    var results = dirs.filter(function(dir) {
      return path.basename(dir) === name
    })

    if (results.length === 0)
      return cb(new Error('module "'+name+'" is not installed'))
    
    return cb(null, results[0])
  }
}