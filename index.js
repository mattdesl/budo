var bole = require('bole')
var log = bole('budo')
var xtend = require('xtend')
var budo = require('./lib/budo')

module.exports = function(entry, opts) {
  var argv = xtend(opts)

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

  //e.g. 
  //clean up entries and take the first one for bundle mapping
  var file
  entries = entries.map(function(entry, i) {
    var map = mapping(entry)
    if (i === 0)
      file = map.to
    return map.from
  })

  //if user specified -o use that as our entry map
  var outfile = argv.serve
  if (outfile && typeof outfile === 'string')
    file = outfile

  argv.port = typeof argv.port === 'number' ? argv.port : 9966
  argv.dir = argv.dir || process.cwd()
  argv.serve = file

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
          //bundle.js changes
          emitter.reload(file)
        })
    }
  }

  function mapping(entry) {
    var parts = entry.split(':')
    if (parts.length > 1 && parts[1].length > 0) {
      return { from: parts[0], to: parts[1] }
    }
    return { from: entry, to: 'bundle.js' }
  }

  function bail(msg) {
    process.nextTick(function() {
      emitter.emit('error', new Error(msg))
    })
  }
}