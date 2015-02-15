var Chrome = require('chrome-remote-interface')
var log = require('bole')('budo')
var path = require('path')
var xtend = require('xtend')
var fs = require('fs')

module.exports = function(opt) {
    var chosenTab
    var chromeDebugger
    var scripts = {}
    var now = Date.now()

    var uri = opt.uri
    var server = Chrome(xtend(opt, { 
        chooseTab: chooseTab
    }))

    server.on('error', function(err) {
        log.error('Cannot connect to chrome:', err)
    })
    server.on('connect', setup)

    //the reload function
    return function(filepath) {
        now = Date.now()
        var base = path.basename(filepath)
        var script = scripts[base]
        if (script) 
            fs.readFile(filepath, 'utf8', update(script))
    }

    function update(script) {
        return function(err, data) {
            if (err) {
                process.stderr.write("Error reading bundle.js: " + err.message+"\n")
            } else if (chromeDebugger) {
                var base = path.basename(script.url)
                var params = {
                    scriptId: script.scriptId,
                    scriptSource: data,
                }
                chromeDebugger.setScriptSource(params, function(scriptErr, response) {
                    if (scriptErr) {
                        process.stderr.write("Error: " + response.message+"\n")
                        log.error("Could not inject source; try reloading page")
                    } else {
                        var elapsed = (Date.now() - now)+'ms'
                        log.info({ url: base, elapsed: elapsed, type: 'inject' })
                    }
                })
            }
        }
    }

    function setup(client) {        
        var port = opt.port || 9222
        log.info("Chrome debugging on", port, "and tab", chosenTab.url)
        
        client.on('Debugger.scriptParsed', function(params) {
            if (params.url.indexOf('http://') >= 0) {
                scripts[path.basename(params.url)] = params
                log.debug({ type: 'parse', url: params.url })
            }
        })

        client.Debugger.enable(function() {
            chromeDebugger = client.Debugger
        })
    }

    function chooseTab(tabs) {
        var idx = 0
        tabs.forEach(function(tab, i) {
            if (tab.url === uri)
                idx = i
        })
        chosenTab = tabs[idx]
        return idx
    }
}