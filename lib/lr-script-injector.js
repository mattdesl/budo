// TODO: Replace the inject-lr-script with this.
var respModifier = require('resp-modifier')
var path = require('path')

module.exports = injectLiveReloadSnippet
function injectLiveReloadSnippet (opts) {
  opts = opts || {}

  var modifier = respModifier({
    rules: [
      { match: /<body[^>]*>/i, fn: prepend }
    ]
  })

  var fn = function (req, res, next) {
    var ext = path.extname(req.url)
    if (!ext || /\.html?$/i.test(ext)) {
      if (!req.headers.accept) {
        req.headers.accept = 'text/html'
      }
    }
    modifier(req, res, next)
  }

  fn.host = opts.host || 'localhost'
  fn.port = opts.port || 35729

  function snippet () {
    var src = '//' + fn.host + ':' + fn.port + '/livereload.js?snipver=1'
    return '<script type="text/javascript" src="' + src + '" async="" defer=""></script>'
  }

  function prepend (req, res, body) {
    return body + snippet()
  }

  return fn
}
