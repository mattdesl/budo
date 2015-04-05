var bole = require('bole')
var log = bole('budo')
var xtend = require('xtend')
var assign = require('xtend/mutable')
var Emitter = require('events/')
var getOutput = require('./lib/get-output')
var rimraf = require('rimraf')
var path = require('path')

var budo = require('./lib/budo')

module.exports = function(entry, opts) {
  var argv = assign({}, opts)

  if (argv.stream) {
    bole.output({
      stream: argv.stream,
      level: 'debug'
    })
  }
  
  var emitter = budo()

  var entries = Array.isArray(entry) ? entry : [entry]
  entries = entries.filter(Boolean)
  if (entries.length === 0) {
    bail("No entry scripts specified!")
    return emitter
  }

  argv.port = typeof argv.port === 'number' ? argv.port : 9966
  argv.dir = argv.dir || process.cwd()
  
  var outfile = argv.o || argv.outfile
  argv.from = entries[0]
  argv.to = path.basename(entries[0])
  
  //run watchify server
  emitter.on('connect', setupLive)
  emitter._start(entries, argv)
    .on('exit', function() {
      log.info('closing')
    })
  
  return emitter

  //if user requested live: true, set it up with some defaults
  function setupLive() {
    if (argv.live || argv['live-plugin']) {
      emitter
        .watch()
        .live()
        .on('watch', function(ev, file) { 
          //HTML/CSS changes
          if (ev === 'change' || ev === 'add')
            emitter.reload(file)
        })
        .on('update', function(file) {
          console.log("Update event")
          //bundle.js changes
          emitter.reload()
        })
    }
  }



  function entryMapping() {
    var to
    var first = entries[0]
    var parts = first.split(':')
    if (parts.length > 1 && parts[1].length > 0) {
      var from = parts[0]
      to = parts[1]
      entries[0] = from
    }
    return to
  }

  function bail(msg) {
    process.nextTick(function() {
      emitter.emit('error', new Error(msg))
    })
  }
}