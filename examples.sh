# typical use, as a watchify dev server
mystc *.js | garnish
mystc *.js -o bundle.js | garnish

# incremental watching with LiveReload plugin
mystc *.js -o bundle.js | wtch bundle.js **/*.{css,html} | garnish

# with hot reload
mystc *.js | injctr --open | garnish


mystc index.js -o bundle.js | wtch -e css,html | injctr bundle.js --open | garnish

mystc index.js -o bundle.js --live --hot

mystc 
knght 
wrlck
dwrf
spllcrft 
wtchcrft
wnd