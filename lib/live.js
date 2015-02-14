var wtch = require('wtch')
var xtend = require('xtend')

var ignores = ['!.git/**', '!node_modules/**', '!bower_components/**']
var extensions = ['css','html']
var defaultGlob = '**/*.{' + extensions.join(',') + '}'


module.exports = function(bundle, opt) {
    var globs = [ defaultGlob ]
    if (bundle)
        globs.push(bundle)
    return wtch(globs, opt)
}