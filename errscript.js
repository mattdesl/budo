#!/usr/bin/env node
// console.log("HELLO")
// process.stdout.write('beep!\x07\n')
// console.log("TTY", process.stdin.isTTY)
// process.stdin.on('data', function (data) {
//   console.log('data',data.toString())
// })
require('get-stdin')().then(function (msg) {
  console.log("ERR: '" + msg.toString() + "'")
})