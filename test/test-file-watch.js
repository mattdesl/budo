var test = require('tape')
var createFileWatch = require('../lib/file-watch')

test('should close immediately', function(t) {
  var watcher = createFileWatch('*.html')
  watcher.on('watch', function() {
    t.fail('should not get watch event')
  })
  watcher.close()
  t.end()
})
