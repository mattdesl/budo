var path = require('path')
var url = require('url')

module.exports = mapEntry
function mapEntry (file) {
  var parts = file.split(':')
  var entry = {}

  if (parts.length > 1 && parts[1].length > 0) {
    entry.from = parts[0]
    entry.to = parts[1]
  } else {
    entry.from = entry.to = file
  }

  var filepath = path.basename(entry.from)
  entry.url = url.parse(filepath).pathname
  return entry
}
