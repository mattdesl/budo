var stripAnsi = require('strip-ansi')

module.exports = errorHandler
module.exports.render = bundleError

function bundleError (message, cwd, rootDirName) {
  // Everything has to be contained inside this function
  // for it to get stringified correctly. i.e. no require()!
  console.error(message)

  if (typeof document === 'undefined') {
    return
  } else if (!document.body) {
    document.addEventListener('DOMContentLoaded', createErrorBox)
  } else {
    createErrorBox()
  }

  function createErrorBox () {
    var parsed = parseError(message)

    var overlayBox = document.createElement('div')
    css(overlayBox, {
      position: 'fixed',
      width: '100%',
      height: '100%',
      zIndex: '100000000',
      top: '0',
      left: '0',
      padding: '20px',
      margin: '0px',
      'box-sizing': 'border-box',
      background: '#fff',
      display: 'block',
      'font-size': '14px',
      'font-weight': 'normal',
      'font-family': 'monospace'
    })

    if (!parsed.format) {
      var pre = document.createElement('pre')
      pre.textContent = message
      css(pre, {
        'word-wrap': 'break-word',
        'white-space': 'pre-wrap',
        'box-sizing': 'border-box',
        margin: '0',
        color: '#ff0000'
      })
      overlayBox.appendChild(pre)
    } else {
      var commonElements = []

      var messageDiv = document.createElement('div')
      commonElements.push(messageDiv)
      messageDiv.textContent = parsed.message
      overlayBox.appendChild(messageDiv)
      css(messageDiv, {
        color: '#ff2e2e',
        'font-size': '16px'
      })

      var pathLocContainer = document.createElement('div')
      css(pathLocContainer, { 'padding-top': '10px' })

      if (isFinite(parsed.line)) {
        var location = document.createElement('div')
        commonElements.push(location)
        var colStr = isFinite(parsed.column) ? (', column ' + parsed.column) : ''
        location.textContent = ('line ' + parsed.line + colStr).trim()
        css(location, {
          color: 'hsl(0, 0%, 50%)',
          'padding-bottom': '0px',
          'font-size': '12px',
          'font-weight': 'bold'
        })
        pathLocContainer.appendChild(location)
      }

      var path = document.createElement('div')
      path.textContent = trimPath(parsed.path)
      commonElements.push(path)
      css(path, { 'font-style': 'italic' })
      pathLocContainer.appendChild(path)
      overlayBox.appendChild(pathLocContainer)

      if (parsed.code) {
        var sourceContainer = document.createElement('div')
        var source = document.createElement('div')
        var hr = document.createElement('div')
        css(hr, {
          background: 'hsl(0, 0%, 90%)',
          width: '100%',
          height: '2px',
          padding: '0',
          'margin-bottom': '10px',
          'margin-top': '10px'
        })
        commonElements.push(source)
        source.textContent = parsed.code
        css(source, {
          color: 'black',
          'font-weight': 'bold',
          'font-size': '14px',
          'padding-left': '0px'
        })

        sourceContainer.appendChild(hr)
        sourceContainer.appendChild(source)
        overlayBox.appendChild(sourceContainer)
      }

      // apply common styles
      commonElements.forEach(function (e) {
        css(e, {
          'word-wrap': 'break-word',
          'white-space': 'pre-wrap',
          'box-sizing': 'border-box',
          display: 'block',
          margin: '0',
          'vertical-align': 'bottom'
        })
      })
    }
    document.body.appendChild(overlayBox)
  }

  function trimPath (filePath) {
    if (filePath.indexOf(cwd) === 0) {
      filePath = rootDirName + filePath.substring(cwd.length + 1)
    }
    return filePath
  }

  function css (element, style) {
    Object.keys(style).forEach(function (k) {
      element.style[k] = style[k]
    })
  }

  // parse an error message into pieces
  function parseError (err) {
    var filePath, lineNum, splitLines
    var result = {}

    // For root files that syntax-error doesn't pick up:
    var parseFilePrefix = 'Parsing file '
    if (err.indexOf(parseFilePrefix) === 0) {
      var pathWithErr = err.substring(parseFilePrefix.length)
      filePath = getFilePath(pathWithErr)
      if (!filePath) return result
      result.path = filePath
      var messageAndLine = pathWithErr.substring(filePath.length)
      lineNum = /\((\d+):(\d+)\)/.exec(messageAndLine)
      if (!lineNum) return result
      result.message = messageAndLine.substring(1, lineNum.index).trim()
      result.line = parseInt(lineNum[1], 10)
      result.column = parseInt(lineNum[2], 10)
      result.format = true
      return result
    }

    // if module not found
    var cannotFindModule = /^Cannot find module '(.+)' from '(.+)'(?:$| while parsing file: (.*)$)/.exec(err.trim())
    if (cannotFindModule) {
      result.missingModule = cannotFindModule[1]
      result.path = cannotFindModule[3] || cannotFindModule[2]
      result.message = "Cannot find module '" + result.missingModule + "'"
      result.format = true
      return result
    }

    // syntax-error returns the path and line number, also a \n at start
    err = err.trim()
    filePath = getFilePath(err)
    if (!filePath) return result
    result.path = filePath

    var restOfMessage = err.substring(filePath.length)
    var parsedSyntaxError = /^:(\d+)/.exec(restOfMessage)
    if (parsedSyntaxError) { // this is a syntax-error
      lineNum = parseInt(parsedSyntaxError[1], 10)
      if (isFinite(lineNum)) result.line = lineNum
      splitLines = restOfMessage.split('\n')
      var code = splitLines.slice(1, splitLines.length - 1).join('\n')
      result.code = code
      result.message = splitLines[splitLines.length - 1]
      result.format = true
      return result
    }

    // remove colon
    restOfMessage = restOfMessage.substring(1).trim()
    var whileParsing = 'while parsing file: '
    var whileParsingIdx = restOfMessage.indexOf(whileParsing)
    if (whileParsingIdx >= 0) {
      var beforeWhile = restOfMessage.substring(0, whileParsingIdx)
      lineNum = /\((\d+):(\d+)\)/.exec(beforeWhile.split('\n')[0])
      var messageStr = beforeWhile
      if (lineNum) {
        var line = parseInt(lineNum[1], 10)
        var col = parseInt(lineNum[2], 10)
        if (isFinite(line)) result.line = line
        if (isFinite(col)) result.column = col
        messageStr = messageStr.substring(0, lineNum.index)
      }
      result.message = messageStr.trim()
      splitLines = restOfMessage.split('\n')
      result.code = splitLines.slice(2).join('\n')
      result.format = true
    }

    return result
  }

  // get a file path from the error message
  function getFilePath (str) {
    var hasRoot = /^[a-z]:/i.exec(str)
    var colonLeftIndex = 0
    if (hasRoot) {
      colonLeftIndex = hasRoot[0].length
    }
    var pathEnd = str.split('\n')[0].indexOf(':', colonLeftIndex)
    if (pathEnd === -1) {
      // invalid string, return non-formattable result
      return null
    }
    return str.substring(0, pathEnd)
  }
}

function errorHandler (err, cwd, rootDirName) {
  console.error('%s', err)
  var msgStr = stripAnsi(err.message)
  var params = [
    JSON.stringify(msgStr),
    JSON.stringify(cwd),
    JSON.stringify(rootDirName)
  ].join(',')
  return ';(' + bundleError + ')(' + params + ');'
}
