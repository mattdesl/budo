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

<center><img src="https://raw.githubusercontent.com/mattdesl/budo/master/screenshots/terminal.png" width="75%" /></center>

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
  }
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

<img src="https://raw.githubusercontent.com/mattdesl/budo/master/screenshots/notify-error.png" width="50%" />

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

If you let budo generate a default HTML page, you can add the `<base>` tag using `--base` or `--base /my-path`.

The `--pushstate` flag also supports subarg syntax, with options passed down to [connect-pushstate](https://www.npmjs.com/package/connect-pushstate). For example:

```sh
budo index.js:bundle.js --pushstate [ --disallow foo/bar ] --live
```

> :warning: As of budo@10.x the command has to be specified *after* the index/JS entries.

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

Make sure you don't pass a `--live` flag to budo, otherwise it will trigger hard reloads on file save.

## SSL and HTTPS

To get HTTPS working, you can specify a `--ssl` flag:

```sh
budo index.js --ssl
```

This will generate a self-signed certificate that expires after one day, and runs the server on `https`.

You can also [generate your own self-signed certificate](#SSL-on-iOS) and specify the file paths manually:

```sh
budo index.js --ssl --cert=mycert.pem --key=mykey.pem
```

For best results, such as LiveReload support, ensure you open the actual IP in your browser, such as `https://192.168.1.7:9966/` (the IP should be listed in terminal).

In Chrome and some other browsers, you may still need to accept the certificate to test it locally. You can do so by clicking "Advanced" and then "Proceed", as in this screen shot:

<img src="https://raw.githubusercontent.com/mattdesl/budo/master/screenshots/ssl-error.png" width="75%" />

You may also want to *Allow invalid certificates for resources loaded from localhost*, see this flag: [chrome://flags/#allow-insecure-localhost](chrome://flags/#allow-insecure-localhost).

## SSL on iOS

Recent versions of iOS will not support WebSockets for untrusted self-signed certificates. The HTTPS server will work, but LiveReload will not connect.

To get at rusted certificate, you can use [LetsEncrypt](https://letsencrypt.org/) if you have a domain. Or, you can follow these steps to get LiveReload working on iOS with a self-signed certificate. The steps assume an OSX computer.

1. Find your internal IP, this should be listed in the terminal when budo starts, and in System Preferences > Network e.g. `192.168.1.50`.

  > **Tip:** You may want to use a [static IP](http://www.macinstruct.com/node/550) to avoid these steps in the future.

2. You need to create a new certificate and key with this IP using the `openssl` commands.

  ```sh
  openssl genrsa -out server.key 2048
  openssl req -new -x509 -sha256 -key server.key -out server.cer -days 365 -subj /CN=192.168.1.50
  ```

  The `CN` field should be set to your IP in step 1.

  > <sup>See [here](https://devcenter.heroku.com/articles/ssl-certificate-self) if you don't have OpenSSL installed.</sup>

3. Now run budo with these to confirm it works:

  ```sh
  budo --ssl --cert=server.cer --key=server.key
  ```

  And paste the full URL in chrome, such as `https://192.168.1.50:9966/`

4. Now open the DevTools and click the Security tab. You should see an error like the one below:

  <img src="https://raw.githubusercontent.com/mattdesl/budo/master/screenshots/ssl-ios-1.png" width="100%" />

  Click the `View Certificate` button, and in the new window Drag & Drop the certificate thumbnail to your desktop.

  <img src="https://raw.githubusercontent.com/mattdesl/budo/master/screenshots/ssl-ios-2.png" width="50%" />

5. This will create a file like `192.168.1.50.cer` on your desktop. AirDrop, email, or otherwise transfer this to your iOS device.

  <img src="https://raw.githubusercontent.com/mattdesl/budo/master/screenshots/ssl-ios-3.png" width="70%" />

6. Accept the file and `Install` the certificate. This will add the certificate to your `General > Profiles` page.

  <img src="https://raw.githubusercontent.com/mattdesl/budo/master/screenshots/ssl-ios-4.png" width="30%" />

Now you should be able to open the same URL on your iPhone for WebSockets and LiveReload to work correctly! :tada:

## Trusted Certificate on OSX

You can follow the steps in [SSL on iOS](#SSL-on-iOS) to trust a self-signed certificate file, like `192.168.1.50.cer`, for your desktop as well.

After generating the `.cer` file, you can double-click it top open it in Keychain. Double-click the listed certificate in Keychain to modify its settings.

<img src="https://raw.githubusercontent.com/mattdesl/budo/master/screenshots/ssl-osx-1.png" width="50%" />

Click the arrow to the left of `Trust` to expand it, and select "Always Trust" from the drop-down.

Close the window (you may be prompted for your root password) and the certificate will no longer give you errors in Chrome and other browsers! :fire:
