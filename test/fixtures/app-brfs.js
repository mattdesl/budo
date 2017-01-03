/* eslint no-path-concat: "off" */
var fs = require('fs')
var text = fs.readFileSync(__dirname + '/text.txt', 'utf8')
console.log(text)
