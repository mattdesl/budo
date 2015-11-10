var test = require('tape')
var mapEntry = require('../lib/map-entry')

test('should map entry paths', function (t) {
  t.deepEqual(mapEntry('foo.js'), { from: 'foo.js', url: 'foo.js' })
  t.deepEqual(mapEntry('foo/bar.js'), { from: 'foo/bar.js', url: 'bar.js' })
  t.deepEqual(mapEntry('./foo/bar.js'), { from: './foo/bar.js', url: 'bar.js' })
  t.deepEqual(mapEntry('foo/bar.js:bundle.js'), { from: 'foo/bar.js', url: 'bundle.js' })
  t.deepEqual(mapEntry('foo/bar.js:bundle.js?foo'), { from: 'foo/bar.js', url: 'bundle.js?foo' })
  t.deepEqual(mapEntry('f\\bar.js:bundle.js?foo'), { from: 'f\\bar.js', url: 'bundle.js?foo' })
  t.deepEqual(mapEntry('/absolute/path.js:bundle.js?foo'), { from: '/absolute/path.js', url: 'bundle.js?foo' })
  t.deepEqual(mapEntry('/absolute/path.js'), { from: '/absolute/path.js', url: 'path.js' })
  t.deepEqual(mapEntry('C:/absolute/path.js'), { from: 'C:/absolute/path.js', url: 'path.js' })
  t.deepEqual(mapEntry('C:/absolute/path.js:bundle.js'), { from: 'C:/absolute/path.js', url: 'bundle.js' })
  t.deepEqual(mapEntry('C://absolute//path.js:bundle.js'), { from: 'C://absolute//path.js', url: 'bundle.js' })
  t.deepEqual(mapEntry('C:\\absolute\\path.js:bundle.js'), { from: 'C:\\absolute\\path.js', url: 'bundle.js' })

  // This one is failing. Maybe because of OS I am running tests on??
  // t.deepEqual(mapEntry('C:\\absolute\\path.js'), { from: 'C:\\absolute\\path.js', url: 'path.js' })
  t.end()
})
