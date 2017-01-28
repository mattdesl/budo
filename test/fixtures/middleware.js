module.exports = function (req, res, next) {
  if (req.url !== '/middleware') { return next() }
  res.write('middleware')
  res.end()
}
