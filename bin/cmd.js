#!/usr/bin/env node

// Starts budo with stdout
// Handles --help and error messaging
// Uses auto port-finding
'ust strict'

const args = process.argv.slice(2)
require('../').cli(args)
