var path = require('path')
var assign = require('xtend/mutable')
var dargs = require('dargs')
var resolve = require('resolve')
var watchify = require('watchify')
var fromArgs = require('watchify/bin/args')

//finds watchify in local or global
//also handles whether to use bin/args or not (for CLI)
module.exports = function (entries, userArgs, opt, cb) {
  var useCLI = opt.cli
  if (useCLI) {
    //use fromArgs for the CLI arguments
    var cliArgs = getCLIArgs(entries, userArgs)
    var instance = fromArgs(cliArgs)
    process.nextTick(function() {
      cb(null, instance)
    })
  } else {
    //determine where watchify is stored locally (relative to budo)
    resolve('watchify', { basedir: __dirname }, function(err, index) {
      if (err) return cb(err)
      //now determine where that watchify's browserify is stored (relative to the local watchify)
      var watchifyPath = path.dirname(index)
      resolve('browserify', { basedir: watchifyPath }, function(err, index) {
        if (err) return cb(err)
        cb(null, fromAPI(index, entries, userArgs))
      })
    })
  }
}

function fromAPI(browserifyIndex, entries, userArgs) {
  var browserify = require(browserifyIndex)

  userArgs = getDefaultArgs(userArgs)
  var b = browserify(userArgs)
  var instance = watchify(b, userArgs)
  entries.forEach(function(entry) {
    instance.add(path.resolve(entry))
  })
  return instance
}

function getDefaultArgs(opt) {
  //ensure we have watchify args setup
  opt = assign({ cache: {}, packageCache: {} }, opt)

  //disable watchify delay since we will handle debouncing manually
  opt.delay = 0

  //handle debug flags
  var debug = typeof opt.debug === 'undefined' ? opt.d : opt.debug

  //if minimist didn't parse it as a boolean (since it can be a string too)
  if (debug === 'false')
    debug = false
  if (debug === 'true')
    debug = true

  //enable debug by default
  if (debug !== false) {
    delete opt.d
    //allow string like 'eval' but otherwise specify as true
    opt.debug = debug || true
  }
  //if user explicitly disabled debug, we can't have it passed
  //at all to watchify/browserify
  else if (debug === false) {
    delete opt.d
    delete opt.debug
  }

  //clean up some possible collisions with budo
  removeCollisions(opt)
  return opt
}

function getCLIArgs(entries, opt) {
  var unparsedArgs = opt['--'] || []
  opt = getDefaultArgs(opt)
  return entries.concat(dargs(opt)).concat(unparsedArgs)
}

function removeCollisions(opt) {
  var collisions = [
    'dir', 'o', 'outfile', 'port',
    'host', 'live', 'serve', 'live-port',
    'live-plugin', 'defaultIndex', 'livePort',
    'livePlugin', 'stream', '--'
  ]
  collisions.forEach(function(col) {
    delete opt[col]
  })
}