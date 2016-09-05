'use strict'

const path = require('path')
const url = require('url')
const resolve = require('resolve')

const mapEntry = (file) => {
  if (file === '.') {
    file = entry()
  }

  let parts
  // absolute path with letter drive, eg C:/
  if (/^[A-Z]\:[\/\\]+/.test(file)) {
    parts = file.split(/\:(?:(?=[^\/\\]))/)
  } else {
    parts = file.split(':')
  }

  let pathFrom = ''
  let pathUrl = ''

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

const entry = () => {
  const cwd = process.cwd()
  const file = resolve.sync('.', { basedir: cwd })
  return file || 'index.js'
}

module.exports = mapEntry
