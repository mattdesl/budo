var test = require('tape')
var budo = require('../')
var browserify = require('browserify')
var watchifyArgs = require('watchify').args
var path = require('path')
var vm = require('vm')
var brfs = require('brfs')
var xtend = require('xtend')

var entry = 'test/fixtures/app-brfs.js'

test('gets connect info', function(t) {
  t.plan(1)
  t.timeoutAfter(10000)

  var bundler = browserify(xtend(watchifyArgs, {
    dbeug: false,
    transform: brfs,
    fullPaths: false,
    insertGlobals: true
  }))

  bundler.add(path.resolve(entry))

  bundler.bundle(function(err, expected) {
    if (err) return t.fail(err)

    var app = budo(entry, {
      transform: brfs,
      debug: false,
      fullPaths: false,
      insertGlobals: true
    }).once('update', function(name, src) {
      t.equal(src.toString(), expected.toString(), 'matches bundler')
      app.close()
    })
  })

  
})

function matches(t, src, message) {
  vm.runInNewContext(src, { 
    console: { 
      log: log 
    },
    global: {}
  })

  function log(msg) {
    t.equal(msg, message, 'the output matches in both cases')
  }
}

// var b = browserify(xtend(watchifyArgs, {
//       debug: opt.debug,
//     }, opt))
//     entries.forEach(function(entry) {
//       entry = entry.split(':')[0]
//       b.add(path.resolve(entry))
//     })

//     b.bundle(function(err, expected) {
//       if (err) t.fail(err)
//       request.get({
//         uri: uri
//       }, function(err, resp, data) {
//         if (err) t.fail(err)

//         //make sure what browserify bundles matches what budo bundles
//         t.equal(data.toString(), expected.toString(), 'bundles match')

//         //also compare output of running both bundles
//         vm.runInNewContext(expected, { 
//           console: { log: log },
//           global: {}
//         });

//         app.close()
//       })
//     })