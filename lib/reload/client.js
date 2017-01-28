var reloadCSS = require('reload-css')
module.exports = connect()

function connect () {
  var reconnectPoll = 1000
  var maxRetries = 50
  var retries = 0
  var reconnectInterval
  var isReconnecting = false
  var protocol = document.location.protocol
  var hostname = document.location.hostname
  var port = document.location.port
  var host = hostname + ':' + port

  var isIOS = /(iOS|iPhone|iPad|iPod)/i.test(navigator.userAgent)
  var isSSL = /^https:/i.test(protocol)
  var queued = []
  var socket = createWebSocket()
  var listeners = []

  var api = {
    send: function (message) {
      message = JSON.stringify(message)
      if (socket && socket.readyState === 1) {
        socket.send(message)
      } else {
        queued.push(message)
      }
    },
    listen: function (cb) {
      if (typeof cb !== 'function') {
        throw new TypeError('cb must be a function!')
      }
      listeners.push(cb)
    },
    reloadPage: reloadPage,
    reloadCSS: reloadCSS
  }

  return api

  function scheduleReconnect () {
    if (isIOS && isSSL) {
      // Special case for iOS with a self-signed certificate.
      console.warn('[budo] LiveReload disconnected. You may need to generate and ' +
        'trust a self-signed certificate, see here:\n' +
        'https://github.com/mattdesl/budo/blob/master/docs/' +
        'command-line-usage.md#ssl-on-ios')
      return
    }
    if (isSSL) {
      // Don't attempt to re-connect in SSL since it will likely be insecure
      console.warn('[budo] LiveReload disconnected. Please reload the page to retry.')
      return
    }
    if (retries >= maxRetries) {
      console.warn('[budo] LiveReload disconnected, exceeded retry count. Please reload the page to retry.')
      return
    }
    if (!isReconnecting) {
      isReconnecting = true
      console.warn('[budo] LiveReload disconnected, retrying...')
    }
    retries++
    clearTimeout(reconnectInterval)
    reconnectInterval = setTimeout(reconnect, reconnectPoll)
  }

  function reconnect () {
    if (socket) {
      // force close the existing socket
      socket.onclose = function () {}
      socket.close()
    }
    socket = createWebSocket()
  }

  function createWebSocket () {
    var wsProtocol = isSSL ? 'wss://' : 'ws://'
    var wsUrl = wsProtocol + host + '/livereload'
    var ws = new window.WebSocket(wsUrl)
    ws.onmessage = function (event) {
      var data
      try {
        data = JSON.parse(event.data)
      } catch (err) {
        console.warn('Error parsing LiveReload server data: ' + event.data)
        return
      }

      if (data.event === 'reload') {
        if (/^\.?css$/i.test(data.ext)) {
          reloadCSS(data.url)
        } else {
          reloadPage()
        }
      }

      // let listeners receive data
      listeners.forEach(function (listener) {
        listener(data)
      })
    }
    ws.onclose = function (ev) {
      if (ev.code === 1000 || ev.code === 1001) {
        // Browser is navigating away.
        return
      }
      scheduleReconnect()
    }
    ws.onopen = function () {
      if (isReconnecting) {
        isReconnecting = false
        retries = 0
        console.warn('[budo] LiveReload reconnected.')
      }
      if (queued.length && ws.readyState === 1) {
        queued.forEach(function (message) {
          ws.send(message)
        })
        queued.length = 0
      }
    }
    ws.onerror = function () {
      return false
    }
    return ws
  }
}

function reloadPage () {
  window.location.reload(true)
}

