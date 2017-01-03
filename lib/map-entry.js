var path = require('path')
var url = require('url')
var resolve = require('resolve')

module.exports = mapEntry
function mapEntry (file) {
  if (file === '.') {
    file = entry()
  }

  var parts
  // absolute path with letter drive, eg C:/
  if (/^[A-Z]:[/\\]+/.test(file)) {
    parts = file.split(/:(?:(?=[^/\\]))/)
  } else {
    parts = file.split(':')
  }

  var pathFrom, pathUrl

  if (parts.length > 1 && parts[1].length > 0) {
    pathFrom = parts[0]
    pathUrl = parts[1]

    if (pathFrom === '.') {
      pathFrom = entry()
    }
  } else {
    pathFrom = file
    pathUrl = url.parse(path.basename(pathFrom)).pathname
  }

  return {
    url: pathUrl,
    from: pathFrom
  }
}

function entry () {
  var cwd = process.cwd()
  var file = resolve.sync('.', { basedir: cwd })
  return file || 'index.js'
}
