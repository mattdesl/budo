var through2 = require('through2')

module.exports = function(opt) {
  var out = through2()
  out.end([
    '<!doctype html>',
    '<head><meta charset="utf-8">',
    '</head><body>',
    '<script src="' + opt.entry + '"></script>',
    '</body>',
    '</html>'
  ].join(''))
  return out
}