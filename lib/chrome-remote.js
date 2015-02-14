var Chrome = require('chrome-remote-interface')
var log = require('bole')('mystc')
var path = require('path')
var xtend = require('xtend')
var fs = require('fs')

module.exports = function(opt) {
    var server = Chrome(xtend(opt, { 
        chooseTab: chooseTab(opt.url)
    }))
    var chromeDebugger
    var scripts = {}

    server.on('error', function(err) {
        log.error('Cannot connect to chrome:', err)
    })
    server.on('connect', setup)

    //the reload function
    return function(filepath) {
        var base = path.basename(filepath)
        var script = scripts[base]
        if (script) 
            fs.readFile(filepath, 'utf8', update(script))
    }

    function update(script) {
        return function(err, data) {
            if (err) {
                process.stderr.write("Error reading bundle.js: " + err.message)
            } else if (chromeDebugger) {
                var base = path.basename(script.url)
                var params = {
                    scriptId: script.scriptId,
                    scriptSource: data,
                }
                chromeDebugger.setScriptSource(params, function(scriptErr, response) {
                    if (scriptErr) {
                        process.stderr.write("Error updating source: " + response.message)
                    } else
                        log.debug({ url: base, type: 'inject' })
                })
            }
        }
    }

    function setup(client) {        
        var port = opt.port || 9222
        log.info("Connected to chrome debugger on port ", port)

        client.on('Debugger.scriptParsed', function(params) {
            if (params.url.indexOf('http://') >= 0) {
                scripts[path.basename(params.url)] = params
                log.debug({ type: 'parse', url: params.url })
            }
        })

        client.Debugger.enable(function() {
            chromeDebugger = client.Debugger
            log.debug("Chrome debugger enabled")
        })
    }
}

function chooseTab(url) {
    return function(tabs) {
        var idx = 0
        tabs.forEach(function(tab, i) {
            if (tab.url === url)
                idx = i
        })
        return idx
    }
}


/*
var through = require('through2');
var chrome = require('chrome-remote-interface');
var path = require('path');
var http = require('http');

var _scripts = {};

var client = chrome({
    chooseTab: function(tabs) {
        var idx = 0
        tabs.forEach(function(tab, i) {
            if (tab.url === 'http://localhost:9966/')
                idx = i
        })
        console.log("CHOOSING TAB", idx)
        return idx
    }
}, function(client) {
    client.on('error', function() {
        throw 'ERROR'
    });

    console.log(JSON.stringify({
        time: new Date(),
        level: 'info',
        message: 'client connected on port 9222',
    }));

    function parse(buf, enc, next) {
        try {
            var data = JSON.parse(buf);
            if (data.type == 'change') {
                var script = _scripts[data.url];

                console.log("FOUND SCRIPT", data.url)
                if (script) {
                    console.log("GET SCRIPT", script.url)
                    http.get(script.url, function(res) {
                        var source = '';

                        res.setEncoding('utf-8');
                        res.on('data', function(chunk) {
                            source += chunk;
                        });

                        res.on('end', function() {
                            var params = {
                                scriptId: script.scriptId,
                                scriptSource: source,
                            };

                            console.log("Set script source", script.scriptId)
                            client.Debugger.setScriptSource(params, function(error, response) {
                                if (error) {
                                    return console.log(JSON.stringify({
                                        time: new Date(),
                                        level: 'error',
                                        message: response.message,
                                    }));
                                }

                                console.log(JSON.stringify({
                                    time: new Date(),
                                    level: 'info',
                                    event: 'source',
                                    url: data.url,
                                }));
                            });
                        });
                    });
                }
            }
        } catch (err) {
            // no-op
        }

        this.push(buf);
        next();
    }

    client.on('Debugger.scriptParsed', function(params) {
        if (params.url.indexOf('http://') > -1) {
            _scripts[path.basename(params.url)] = params;
        }
    });

    client.Debugger.enable(function() {
        console.log("Debugger enabled")
    });
});*/