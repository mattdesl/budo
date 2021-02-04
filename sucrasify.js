var { Transform, PassThrough } = require("stream");
let sucrase = require("sucrase");
var sucrasify = configure();

module.exports = sucrasify;
module.exports.sucrasify = sucrasify;
module.exports.configure = configure;

/** @type import('sucrase').Options */
var sucraseConfig = (file) => ({
  transforms: ["typescript", "imports", "jsx"],
  production: true,
  filePath: file,
  //enableLegacyTypeScriptModuleInterop: true
  enableLegacyBabel5ModuleInterop: true,
});

function configure() {
  return function (filename) {
    if (/\.[tj]sx?$/i.test(filename) === false) {
      return new PassThrough();
    }
    const sucraseOptions = sucraseConfig(filename);
    if (sucraseOptions === null) {
      return PassThrough();
    }
    return new SucraseStream(sucraseOptions);
  };
}

class SucraseStream extends Transform {
  constructor(opts) {
    super();
    this._data = [];
    this._opts = opts;
  }

  _transform(buf, enc, callback) {
    this._data.push(buf);
    callback();
  }

  _flush(callback) {
    // Merge the buffer pieces after all are available
    const data = Buffer.concat(this._data).toString();

    try {
      let result = sucrase.transform(data, this._opts);
      var code = result !== null ? result.code : data;
      this.push(code);
      callback();
    } catch (e) {
      callback(e);
    }
  }
}

// transforms: Array<Transform>;
// /**
//  * If specified, function name to use in place of React.createClass when compiling JSX.
//  */
// jsxPragma?: string;
// /**
//  * If specified, function name to use in place of React.Fragment when compiling JSX.
//  */
// jsxFragmentPragma?: string;
// /**
//  * If true, replicate the import behavior of TypeScript's esModuleInterop: false.
//  */
// enableLegacyTypeScriptModuleInterop?: boolean;
// /**
//  * If true, replicate the import behavior Babel 5 and babel-plugin-add-module-exports.
//  */
// enableLegacyBabel5ModuleInterop?: boolean;
// /**
//  * If specified, we also return a RawSourceMap object alongside the code. Currently, source maps
//  * simply map each line to the original line without any mappings within lines, since Sucrase
//  * preserves line numbers. filePath must be specified if this option is enabled.
//  */
// sourceMapOptions?: SourceMapOptions;
// /**
//  * File path to use in error messages, React display names, and source maps.
//  */
// filePath?: string;
// /**
//  * If specified, omit any development-specific code in the output.
//  */
// production?: boolean

// function buildTransform(opts) {
//   return function (filename, transformOpts) {
//     const babelOpts = normalizeOptions(opts, transformOpts, filename);
//     if (babelOpts === null) {
//       return stream.PassThrough();
//     }
//     return new SucraseStream(babelOpts);
//   };
// }
