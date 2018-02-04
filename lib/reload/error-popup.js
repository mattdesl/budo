var popupContainer, popupText

module.exports.hide = clearPopup
function clearPopup () {
  if (popupContainer && popupContainer.parentNode) {
    popupContainer.parentNode.removeChild(popupContainer)
  }
  if (popupText && popupText.parentNode) {
    popupText.parentNode.removeChild(popupText)
  }
  popupContainer = null
  popupText = null
}

module.exports.show = show
function show (message) {
  if (popupText) {
    popupText.textContent = message
    return
  }

  var element = document.createElement('div')
  var child = document.createElement('pre')
  child.textContent = message

  css(element, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    zIndex: '100000000',
    padding: '0',
    margin: '0',
    'box-sizing': 'border-box',
    background: 'transparent',
    display: 'block',
    overflow: 'initial'
  })
  css(child, {
    padding: '20px',
    overflow: 'initial',
    zIndex: '100000000',
    'box-sizing': 'border-box',
    background: '#fff',
    display: 'block',
    'font-size': '12px',
    'font-weight': 'normal',
    'font-family': 'monospace',
    'word-wrap': 'break-word',
    'white-space': 'pre-wrap',
    color: '#ff0000',
    margin: '10px',
    border: '1px dashed hsla(0, 0%, 50%, 0.25)',
    borderRadius: '5px',
    boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.2)'
  })
  element.appendChild(child)
  document.body.appendChild(element)
  popupText = child
  popupContainer = element
}

function css (element, obj) {
  for (var k in obj) {
    if (obj.hasOwnProperty(k)) element.style[k] = obj[k]
  }
  return obj
}
