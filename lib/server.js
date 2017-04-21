var http = require('http')
var https = require('https')
var pem = require('pem')
var createMiddleware = require('./middleware')
var fs = require('fs')

module.exports = function createServer (entryMiddleware, opts, cb) {
  var handler = createMiddleware(entryMiddleware, opts)
  var ssl = opts.ssl

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
      pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
        if (err) return cb(err)
        create({
          key: keys.serviceKey,
          cert: keys.certificate
        })
      })
    }
  } else {
    // no HTTPS, handle normally
    create()
  }

  function create (httpsOpts) {
    var server = ssl
      ? https.createServer(httpsOpts, handler)
      : http.createServer(handler)
    server.setLiveOptions = handler.setLiveOptions

    // TODO: Perhaps --ssl should support some sort of HTTP -> HTTPS redirect
    process.nextTick(function () {
      cb(null, server)
    })
  }
}
