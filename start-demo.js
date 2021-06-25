const budo = require("./");

const start = () => {
  budo("example/app.ts", {
    dir: "example",
    live: true,
    //live: "./**/*.css",
    //stream: process.stdout,
    port: 8080,
    serve: "bundle.js",
    open: true,
    browserify: {
      debug: true,
    },
    output: {
      file: "tester.js",
    }
  });
};

start();
