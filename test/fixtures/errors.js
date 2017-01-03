module.exports = [
  [
    'Parsing file /projects/budo-modules/test-budo-html/index.js: Unexpected token (2:19)',
    { path: '/projects/budo-modules/test-budo-html/index.js', line: 2, column: 19, message: 'Unexpected token', format: true }
  ],
  [
    'Parsing file D:\\folder\\test.xml: Unexpected token (2:19)',
    { path: 'D:\\folder\\test.xml', line: 2, column: 19, message: 'Unexpected token', format: true }
  ],
  [
    "Cannot find module 'foo' from '/projects/budo-modules/test-budo-html'",
    { path: '/projects/budo-modules/test-budo-html', missingModule: 'foo', message: "Cannot find module 'foo'", format: true }
  ],
  [
    '\n/projects/budo-modules/test-budo-html/index.js:4\nconsole.log(Array.isArray(x) res.push());\n                             ^\nParseError: Unexpected token',
    { code: 'console.log(Array.isArray(x) res.push());\n                             ^', format: true, line: 4, message: 'ParseError: Unexpected token', path: '/projects/budo-modules/test-budo-html/index.js' }
  ],
  [
    '/projects/budo-modules/test-budo-html/index.js: "f" is read-only while parsing file: /projects/budo-modules/test-budo-html/index.js\n\n  1 | const f = require("f")\n> 2 | f = 2;\n    | ^',
    { path: '/projects/budo-modules/test-budo-html/index.js', message: '"f" is read-only', code: '  1 | const f = require("f")\n> 2 | f = 2;\n    | ^', format: true }
  ],
  [
    '/projects/budo-modules/test-budo-html/index.js: Unexpected token (1:16) while parsing file: /projects/budo-modules/test-budo-html/index.js\n\n> 1 | const f = () => ;\n    |                 ^',
    { path: '/projects/budo-modules/test-budo-html/index.js', message: 'Unexpected token', line: 1, column: 16, code: '> 1 | const f = () => ;\n    |                 ^', format: true }
  ],
  [
    '/projects/budo-modules/test-budo-html/index.js: Unexpected token, expected ( (2:6) while parsing file: /projects/budo-modules/test-budo-html/index.js\n\n  1 | class Foo {\n> 2 |   sup {\n    |       ^\n  3 |     \n  4 |   }\n  5 | }',
    { path: '/projects/budo-modules/test-budo-html/index.js', message: 'Unexpected token, expected (', line: 2, column: 6, code: '  1 | class Foo {\n> 2 |   sup {\n    |       ^\n  3 |     \n  4 |   }\n  5 | }', format: true }
  ],
  [
    "/projects/budo-modules/test-budo-html/test space/index.js: Unexpected token, expected , (1:17) while parsing file: /projects/budo-modules/test-budo-html/test space/index.js\n\n> 1 | console.log(\"FOO\"'')\n    |                  ^",
    { path: '/projects/budo-modules/test-budo-html/test space/index.js', message: 'Unexpected token, expected ,', line: 1, column: 17, code: "> 1 | console.log(\"FOO\"'')\n    |                  ^", format: true }
  ],
  [
    'Unusual error message at file.js!',
    { }
  ],
  [
    '/projects/budo-modules/test-budo-html/test space/index.js: Foobar!',
    { path: '/projects/budo-modules/test-budo-html/test space/index.js' }
  ]
]
