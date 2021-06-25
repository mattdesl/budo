var test = require('tape')
var budo = require('../')

var request = require('request')
var xtend = require('xtend')
var browserify = require('browserify')
var path = require('path')
var vm = require('vm')
var mapEntry = require('../lib/map-entry')
const sucrasify = require('../lib/sucrasify')

test('serves app.js', run('test/fixtures/app.js'))
test('entry mapping to bundle.js', run('test/fixtures/app.js:bundle.js'))
test('turns off debug', run('test/fixtures/app', { debug: false }))
test('brfs transform', run('test/fixtures/app-brfs', {
  message: 'foobar',
  browserify: {
    transform: 'brfs'
  }
}))

test('bundles multiple', run([
  'test/fixtures/first',
  'test/fixtures/second'
], {
  message: 'foo bar'
}))
test('bundles multiple and serves as static/bundle.js', run([
  'test/fixtures/first',
  'test/fixtures/second'
], {
  message: 'foo bar',
  serve: 'static/bundle.js',
  shouldServe: 'static/bundle.js'
}))

test('handles paths beginning with dot slash', run(['./test/fixtures/app.js'], {
  message: 'from browserify',
  shouldServe: 'app.js'
}))

test('should also serve relative paths', run(['../budo/test/fixtures/app.js'], {
  message: 'from browserify',
  shouldServe: 'app.js'
}))

var abs = path.resolve(__dirname, 'fixtures', 'app.js')
test('should serve absolute paths', run(abs, {
  message: 'from browserify',
  shouldServe: 'app.js'
}))
test('serve absolute with mapping', run(abs + ':boop.js', {
  message: 'from browserify',
  shouldServe: 'boop.js'
}))

test('does not break on query params', run('test/fixtures/with space.js:bundle.js?debug=true', {
  shouldServe: 'bundle.js?debug=true',
  message: 'with space'
}))

test('serves with spaces and entry to bundle.js', run('test/fixtures/with space.js', {
  serve: 'bundle.js',
  shouldServe: 'bundle.js',
  message: 'with space'
}))

test('serves with spaces default', run('test/fixtures/with space.js', {
  message: 'with space',
  shouldServe: 'with%20space.js'
}))

function run (entries, opt) {
  return function (t) {
    matches(t, entries, opt)
  }
}

function matches (t, entries, opt) {
  opt = xtend({ dir: __dirname, debug: true }, opt)

  var message = opt.message || 'from browserify'
  var shouldServe = opt.shouldServe
  delete opt.message
  delete opt.shouldServe

  t.plan(shouldServe ? 5 : 4)
  var uri
  if (!Array.isArray(entries)) {
    entries = [ entries ]
  }

  var app = budo(entries, opt)
    .on('connect', function (ev) {
      if (shouldServe) {
        t.equal(ev.serve, shouldServe, 'serves correct bundle file')
      }
      uri = ev.uri + ev.serve
      t.ok(true, 'connected')
    })
    .once('update', function () {
      var b = browserify(xtend({
        debug: opt.debug
      }, opt.browserify)).transform(sucrasify)
      entries.forEach(function (entry) {
        entry = mapEntry(entry).from
        b.add(path.resolve(entry))
      })

      b.bundle(function (err, expected) {
        if (err) t.fail(err)
        request.get({
          uri: uri
        }, function (err, resp, data) {
          if (err) t.fail(err)

          // make sure what browserify bundles matches what budo bundles
          t.equal(data.toString(), expected.toString(), 'bundles match')

          // also compare output of running both bundles
          vm.runInNewContext(data.toString(), {
            console: { log: log },
            global: {}
          })

          app.close()
        })
      })
    })
    .on('exit', function () {
      t.ok(true, 'closing')
    })
    .on('error', t.fail.bind(t))

  function log (msg) {
    t.equal(msg, message, 'the output matches in both cases')
  }
}
