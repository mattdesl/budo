module.exports = function(opt) {
    var livereload = ''

    if (opt.live) {
        var host = (opt.host || 'localhost').split(':')[0]
        var lrport = opt.livePort || 35729
        livereload = [
            '<script type="text/javascript"',
            ' src="http://',
            host, ':', lrport,
            '/livereload.js?snipver=1"></script>'
        ].join('')
    }

    return [
        '<!doctype html>',
        '<head><meta charset="utf-8"></head>',
        '<body>',
        livereload,
        '<script src="' + opt.outfile + '"></script>',
        '</body>',
        '</html>'
    ].join('')
}