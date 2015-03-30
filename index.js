var bole = require('bole')
var log = bole('budo')
var xtend = require('xtend')
var assign = require('xtend/mutable')
var Emitter = require('events/')
var getOutput = require('./lib/get-output')
var wtch = require('wtch')

var budo = require('./lib/budo')

module.exports = function(entry, opts) {
  var argv = assign({}, opts)

  if (argv.stream) {
    bole.output({
      stream: argv.stream,
      level: 'debug'
    })
  }

  var emitter = new Emitter()
  emitter.on('connect', setupLive)

  var entries = Array.isArray(entry) ? entry : [entry]
  entries = entries.filter(Boolean)
  if (entries.length === 0) {
    bail("No entry scripts specified!")
    return emitter
  }

  argv.port = typeof argv.port === 'number' ? argv.port : 9966
  argv.dir = argv.dir || process.cwd()
  var outOpts = xtend(argv, {
    __to: entryMapping()
  })

  getOutput(outOpts, function(err, output) {
    if (err) {
      bail("Error: Could not create temp bundle.js directory")
      return emitter
    }

    //run watchify server
    var app = budo(entries, output, argv)
      .on('error', function(err2) {
        var msg = "Error running budo on " + argv.port + ': ' + err2
        bail(msg)
      })
      .on('exit', function() {
        log.info('closing')
        emitter.emit('exit')
      })

    app.on('connect', emitter.emit.bind(emitter, 'connect'))
    app.on('watch', emitter.emit.bind(emitter, 'watch'))
    app.on('reload', emitter.emit.bind(emitter, 'reload'))
  })

  return emitter

  //if user requested live: true, set it up with some defaults
  function setupLive(app) {
    if (argv.live || argv['live-plugin']) {
      app
        .watch()
        .live({ 
          host: argv.host,
          port: argv['live-port']
        })
        .on('watch', function(ev, file) {
          if (ev === 'change' || ev === 'add') {
            app.reload(file)
          }
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