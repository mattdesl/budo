var url = require('url')
var path = require('path')

var defaultName = 'bundle.js'
var fixable = /^.[\\\/]+/

// This could be improved to create better
// consistency with relative/absolute/etc paths
// PRs/ideas welcome :)
// https://github.com/mattdesl/budo/issues/42

module.exports = function cleanPath (file, serveAs) {
  // no entry, or "./" or "."
  // just use "bundle.js" in this case
  if (!file || /^\.[\/\\]*$/.test(file)) {
    return defaultName
  }

  // if "./" or ".\\" is starting
  // we can just fix it by chopping that off
  if (fixable.test(file)) {
    file = file.replace(fixable, '')
  } else if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[\\\/])/.test(file)) {
    // otherwise, see if path is relative/absolute
    return path.basename(file)
  }

  // path is not relative/absolute, just treat as usual
  return url.parse(file).path
}
