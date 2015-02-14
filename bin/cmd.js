#!/usr/bin/env node
var args = process.argv.slice(2)
var argv = require('minimist')(args)

require('./run')(args)