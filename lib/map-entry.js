var path = require('path')
var url = require('url')

module.exports = mapEntry
function mapEntry (file) {
  var parts = file.split(':')
  var pathFrom, pathTo, pathUrl

  if (parts.length > 1 && parts[1].length > 0) {
    pathFrom = parts[0]
    pathTo = parts[1]
    pathUrl = pathTo
  } else {
    pathFrom = pathTo = file
    pathUrl = url.parse(path.basename(pathFrom)).pathname
  }

  return {
    url: pathUrl,
    from: pathFrom,
    to: pathTo
  }
}
