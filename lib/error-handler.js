'use strict'

const stripAnsi = require('strip-ansi')

const bundleError = (message) => {
  console.error(message)
  if (typeof document === 'undefined') {
    return
  } else if (!document.body) {
    document.addEventListener('DOMContentLoaded', print)
  } else {
    print()
  }
  const print = () => {
    const pre = document.createElement('pre')
    pre.textContent = message
    const style = {
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
      'font-family': 'monospace',
      margin: '0',
      background: '#fff', // or ffefef ?
      color: '#ff0000'
    }

    Object.keys(style).forEach((k) => pre.style[k] = style[k])
    document.body.appendChild(pre)
  }
}

const errorHandler = (err) => {
  console.error('%s', err)
  const msgStr = stripAnsi(err.message)
  return `;(${bundleError})(${JSON.stringify(msgStr)});`
}

module.exports = errorHandler
