'use strict'

const http = require('http')
const https = require('https')
const pem = require('pem')
const createMiddleware = require('./middleware')
const fs = require('fs')

const createServer = (entryMiddleware, opts, cb) => {
  const handler = createMiddleware(entryMiddleware, opts)
  const ssl = opts.ssl
  const create = (httpsOpts) => {
    const server = ssl
      ? https.createServer(httpsOpts, handler)
      : http.createServer(handler)
    server.setLiveOptions = handler.setLiveOptions

    // TODO: Perhaps --ssl should support some sort of HTTP -> HTTPS redirect
    process.nextTick(() => {
      cb(null, server, httpsOpts)
    })
  }

  if (ssl && (!opts.cert && opts.key) || (!opts.key && opts.cert)) {
    throw new TypeError('If you specify a cert, you must specify a key and vice versa.\n' +
        'Or, you can omit the "cert" and "key" options to generate a new self-signed certificate.')
  }

  if (opts.ssl) {
    if (opts.cert && opts.key) {
      // user specified their own cert/key pair
      create({
        cert: fs.readFileSync(opts.cert),
        key: fs.readFileSync(opts.key)
      })
    } else {
      // generate a self-signed cert
      pem.createCertificate({ days: 1, selfSigned: true }, (err, keys) => {
        if (err) return cb(err)
        create({
          key: keys.serviceKey,
          cert: keys.certificate
        })
      })
    }
  } else {
    create()
  }
}

module.exports = createServer
