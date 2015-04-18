## basics

budō allows you to get your scripts up and running quickly in a local environment. 

First, you will need [NodeJS and npm](http://nodejs.org/download/). Then you can install the tools globally:

```sh
npm install budo watchify garnish -g
```

Now we can run budo to serve a file and start developing. Here we pipe the output to [garnish](https://github.com/mattdesl/garnish) for prettier colors in the terminal, but this is optional.

```sh
budo index.js --verbose | garnish
```

Open [http://localhost:9966/](http://localhost:9966/) to see the bundled result of `index.js`. 

Saving `index.js` will be incremental, which means it will be fast even if your app spans hundreds of modules. 

## index.html

Notice we haven't had to write any HTML! If you want to, though, you can drop `index.html` in the same folder that you are serving budō from (or `--dir` folder), and it will use that instead of a dynamically generated index.

The `src` for your script tag should match the entry point you gave.

```html
<script src="index.js"></script>
```

You can specify a different end point for the server with a colon:

```sh
budo index.js:static/bundle.js | garnish
```

Your HTML would the look like this:

```html
<script src="static/bundle.js"></script>
```

## local installation

If you are using these in your modules for demos/etc, you should save them locally so that others can get the same versions when they `git clone` and `npm install` your repo.

```sh
npm install budo watchify garnish --save-dev
```

For local tools, we need to use [npm-scripts](https://docs.npmjs.com/misc/scripts). Open up your package.json and update `"scripts"` so it looks like this:

```sh
  "scripts": {
    "start": "budo index.js --verbose | garnish"
  },
```

Now running the following will start the development server:

```sh
npm run start
```

## live reload

budō also includes support for [LiveReload](livereload.com). The `--live` argument injects a script tag into your HTML file and listens for a live reload server.

```sh
budo index.js --live | garnish
```

Now when you save the `index.js` file, it will trigger a LiveReload event on your `localhost:9966` tab after watchify has finished bundling. It also listens to HTML and CSS reload, and injects stylesheets without a page refresh. 

Alternatively, you can use `--live-plugin` if you want to enable LiveReload through the browser extension (e.g. [for Chrome](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei?hl=en)). In this case, no script is injected into the HTML, and you need to [enable LiveReload manually](https://github.com/mattdesl/wtch#setup).

## multiple entries

Budo also supports multiple entry points; they will all get concatenated into a single bundle. If you aren't using a colon separator (`:`), the entry point will default to the first path. Or, you can explicitly set the path with the `--serve` option, as below:

```sh
budo test/*.js --serve static/bundle.js | garnish
```

## unparsed arguments

Everything after the `--` argument will not be parsed/manipulated, and will be passed directly to browserify. 

Currently, this is needed when using sub-arg syntax:

```sh
budo main.js --live -v -- -t [ foo --bar=555 --debug ]
```