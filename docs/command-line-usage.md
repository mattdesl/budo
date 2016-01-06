## basics

budō allows you to get your scripts up and running quickly in a local environment. 

First, you will need [NodeJS and npm](http://nodejs.org/download/). Then you can install the tools globally:

```sh
npm install budo -g
```

Now we can run budo to serve a file and start developing.

```sh
budo index.js
```

Open [http://localhost:9966/](http://localhost:9966/) to see the bundled result of `index.js`. 

<center><img src="http://i.imgur.com/Pvus8vy.png" width="75%" /></center>

Saving `index.js` will be incremental, which means it will be fast even if your app spans hundreds of modules. 

If you specify the current directory, it will resolve to the `"main"` field in your package.json, otherwise `index.js`.

```sh
budo .
```

You can see the full list of command-line flags in the [README.md](../README.md#cli).

## index.html

Notice we haven't had to write any HTML! If you want to, though, you can drop `index.html` in the same folder that you are serving budō from (or the base `--dir` folder), and it will use that instead of a dynamically generated index.

The `src` for your script tag should match the filename of the entry point you gave.

```html
<script src="index.js"></script>
```

You can specify a different end point for the server with a colon. This is useful for relative and absolute paths, for example:

```sh
budo /proj/foo/index.js:static/bundle.js
```

Now, you can use the following as your HTML:

```html
<script src="static/bundle.js"></script>
```

Also see the [`--serve` option](#multiple entries).

## local installation

If you are using these in your modules for demos/etc, you should save them locally so that others can get the same versions when they `git clone` and `npm install` your repo.

```sh
npm install budo --save-dev
```

For local tools, we need to use [npm-scripts](https://docs.npmjs.com/misc/scripts). Open up your package.json and update `"scripts"` so it looks like this:

```sh
  "scripts": {
    "start": "budo index.js"
  },
```

Now running the following will start the development server:

```sh
npm run start
```

## live reload

budō also includes support for [LiveReload](livereload.com). The `--live` argument injects a script tag into your HTML file and listens for a live reload server.

```sh
budo index.js --live
```

Now when you save the `index.js` file, it will trigger a LiveReload event on your `localhost:9966` tab after watchify has finished bundling. It also listens to HTML and CSS reload, and injects stylesheets without a page refresh. 

From the command line, you can specify a filename glob to only trigger LiveReload in those cases. For example, to only allow CSS and HTML changes to trigger a LiveReload:

```sh
budo index.js --live=*.{html,css}
```

*Note:* Your `index.html` must have a `<body>` tag for the LiveReload script to get injected!

## multiple entries

Budo also supports multiple entry points; they will all get concatenated into a single bundle. If you aren't using a colon separator (`:`), the entry point will default to the first path. Or, you can explicitly set the path with the `--serve` option, as below:

```sh
budo test/one.js test/two.js --serve static/bundle.js
```

Note the path here is relative to your `--dir` folder from where the `index.html` is being served.

## browserify arguments

Everything after the `--` argument will not be parsed/manipulated, and will be passed directly to browserify. 

```sh
budo main.js --live -- -t babelify -t glslify
```

You can also add a [`"browserify"` field](https://github.com/substack/browserify-handbook#browserifytransform-field) to your `package.json` file, and budo will use that config. This is not typically recommended for modules, but it can be useful when building applications.

## launch

To launch the browser once the server connects, you can use the `--open` or `-o` flag:

```sh
budo index.js --open
```

Also see [opnr](https://github.com/mattdesl/opnr), which allows for a similar functionality without forcing it as a command-line flag.

## `--onupdate`

In the CLI, you can run shell commands when the bundle updates using the `--onupdate` option. For example, to lint with [standard](https://github.com/feross/standard) and provide an alert with [notify-error](https://github.com/mattdesl/notify-error):

```sh
budo index.js --onupdate "standard | notify-error"
```

Now, when you save the bundle, `standard` will run on your directory. If lint errors are found, they will print to the console and show an alert notification:

<img src="http://i.imgur.com/NWnDp4v.png" width="50%" />

The flag is only available in the command-line.

## internal IP

By default, budo's server will listen on your internal IP. This address is the first message logged to terminal.

This makes it easy to test during development across devices.

You can specify another address with the `--host` flag.

## pushstate

You can set a `--pushstate` flag to make the server capable for HTML5 pushState Single-Page Applications.

Now, any 404 requests (such as `/foo/bar/blah`) will get routed to the home `index.html`.

It is suggested you add a `<base>` in your `index.html` for this to work with nested paths:

```html
<head>
  <base href="/">
  <!-- styles, scripts, etc... -->
  <link rel="stylesheet" href="main.css">
</head>
```

## hot module replacement

The following can integrate easily with budo:

- Generic HMR: [browserify-hmr](https://github.com/AgentME/browserify-hmr)
- React: [livereactload](https://github.com/milankinen/livereactload)
- Vue: [vueify](https://github.com/vuejs/vueify) (to be used with `browserify-hmr`)

You can usually follow the steps in those tools, except instead of using `watchify`, we will use `budo` and pass our browserify options after a full stop `--`.

Example with [livereactload](https://github.com/milankinen/livereactload):

```sh
budo index.js:bundle.js -- -t babelify -p livereactload
```

Make sure to disable the `--live` flag, otherwise it will trigger hard reloads.