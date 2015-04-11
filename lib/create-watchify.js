var resolve = require('resolve')
var getModule = require('resolve-npm-which')
var path = require('path')
var assign = require('xtend/mutable')
var dargs = require('dargs')

//finds watchify in local or global
//also handles whether to use bin/args or not (for CLI)
module.exports = function (entries, userArgs, opt, cb) {
  var useFromArgs = opt.cli

  getModule('watchify', opt, function(err, watchifyDir) {
    if (err)
      return cb(err)

    //create a watchify instance manually
    //(supports transform/plugin as objects)
    if (!useFromArgs) {
      resolve('browserify', { 
        basedir: watchifyDir
      }, function(err, browserifyModule) {
        if (err)
          return cb(new Error('could not find watchify/node_modules/browserify - unsupported watchify version'))
        cb(null, fromAPI(browserifyModule, watchifyDir, entries, userArgs))
      })
    } 
    //otherwise let watchify parse the CLI options for us
    //(does not support transform/plugin as objects)
    else {
      resolve('./bin/args.js', { 
        basedir: watchifyDir
      }, function(err, fromArgsModule) {
        if (err) {
          return cb(new Error('could not find watchify/bin/args.js - unsupported watchify version'))
        }
        cb(null, fromCLI(fromArgsModule, entries, userArgs))
      })
    }
  })
}

function fromAPI(browserifyDir, watchifyDir, entries, userArgs) {
  var watchify = require(watchifyDir)
  var browserify = require(browserifyDir)

  var b = browserify(getDefaultArgs(userArgs))
  var instance = watchify(b)
  entries.forEach(function(entry) {
    instance.add(path.resolve(entry))
  })
  return instance
}

function fromCLI(dir, entries, userArgs) {
  var cliArgs = getCLIArgs(entries, userArgs)
  var fromArgs = require(dir)
  return fromArgs(cliArgs)
}

function getDefaultArgs(opt) {
  //ensure we have watchify args setup
  opt = assign({ cache: {}, packageCache: {} }, opt)

  //disable delay since we will handle debouncing manually
  opt.delay = 0

  //enable debug by default
  if (opt.d !== false && opt.debug !== false) {
    delete opt.d
    opt.debug = true
  }
  //if user explicitly disabled debug...
  else if (opt.d === false || opt.debug === false) {
    delete opt.d
    delete opt.debug
  }

  //clean up some possible collisions with budo
  removeCollisions(opt)
  return opt
}

function getCLIArgs(entries, opt) {
  opt = getDefaultArgs(opt)
  return entries.concat(dargs(opt))
}

function removeCollisions(opt) {
  var collisions = [
    'dir', 'o', 'outfile', 'port',
    'host', 'live', 'serve', 'live-port',
    'live-plugin', 'defaultIndex'
  ]
  collisions.forEach(function(col) {
    delete opt[col]
  })
}