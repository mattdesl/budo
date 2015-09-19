var stripAnsi = require('strip-ansi')

module.exports = errorHandler

function bundleError (message) {
  console.error(message)
  if (typeof document === 'undefined') {
    return
  } else if (!document.body) {
    document.addEventListener('DOMContentLoaded', print)
  } else {
    print()
  }
  function print () {
    var pre = document.createElement('pre')
    pre.textContent = message
    var style = {
      position: 'fixed',
      width: '100%',
      zIndex: '100000',
      height: '100%',
      top: '0',
      left: '0',
      padding: '20px',
      'box-sizing': 'border-box',
      'word-wrap': 'break-word',
      'font-size': '16px',
      margin: '0',
      background: '#fff', // or ffefef ?
      color: '#ff0000'
    }

    Object.keys(style).forEach(function (k) {
      pre.style[k] = style[k]
    })
    document.body.appendChild(pre)
  }
}

function errorHandler (err) {
  console.error('%s', err)
  var msgStr = stripAnsi(err.message)
  return ';(' + bundleError + ')(' + JSON.stringify(msgStr) + ');'
}
