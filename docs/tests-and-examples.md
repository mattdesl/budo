# tests and examples

To run the budō tests or example from source, first clone the repo and install its dependencies.

```sh
git clone https://github.com/mattdesl/budo.git
cd budo
npm install
```

The tasks are run with the `"scripts"` field in [package.json](https://github.com/mattdesl/budo/blob/master/package.json).

## running tests

Now you can run the following to see the unit tests:

```sh
npm test
```

## running the examples

See the [package.json](../package.json) `"scripts"` field for how these work.

#### basic

To run the example:

```sh
npm start
```

Now when you open `localhost:9966` you should see a simple 2D canvas scene with an image. If you update the `example/index.js` source, you will see watchify emitting logs in the console. Refreshing the page will show the new bundle.

#### live reload

To run the example with live reloading:

```sh
npm run live
```

Again, open `localhost:9966` and try making changes to `example/app.js`, `example/index.html` or `example/theme.css`. The CSS should be injected without a page refresh, and HTML/JS content will trigger a page reload. 

#### budo-less

An example of LESS recompilation on the fly, without writing to a file.

```sh
npm run budo-less
```

Now open `localhost:9966` and try making changes to `example/style.less` (with LESS syntax). On file save, it will re-request `main.css`. The middleware function compiles the LESS file on the fly and writes CSS as the server response.

The benefit of this approach is that the development and production build can use the same `index.html`, since the paths do not need to change. This is particularly useful for GitHub demos.

See `examples/budo-less.js` for the build script.