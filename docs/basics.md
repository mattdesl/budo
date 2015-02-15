## basics

budō allows you to get your scripts up and running quickly in a local environment. 

First, you will need [NodeJS and npm](http://nodejs.org/download/). Then you can install the tools globally like so:

```sh
npm install budo watchify garnish -g
```

Later we will explore the benefits of saving these locally, but for now it's easier to get up and running if they are global. 

The next step is to create an index.js file and start serving it with budō:

```sh
cd my-cool-project
touch index.js
budo index.js --outfile bundle.js --verbose
```

Now if you open `localhost:9966` in your browser, it will serve you with the bundled output of `index.js`.

When you save `index.js`, the script will be re-built into the `bundle.js` output file. Watchify will also print the time elapsed into console.

## pretty-printing

Earlier we installed [garnish](https://github.com/mattdesl/garnish), which will give us a nicer output in terminal. We can use it like so:

```sh
budo index.js --outfile bundle.js | garnish
```

## live reload

budō also includes some support for [LiveReload](livereload.com).

First, install the LiveReload plugin for your browser of choice (e.g. [Chrome](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei?hl=en)). 

Now, run budō with the `--live` option:

```sh
budo index.js --outfile bundle.js --live | garnish
```

Open `localhost:9966` and enable LiveReload by clicking the plugin. The center circle will turn black. You may need to refresh the page first.

![Click to enable](http://i.imgur.com/YdCgusY.png)

Now when you save the `index.js` file, it will trigger a live-reload event on your `localhost:9966` tab after watchify has finished bundling. It also listens to HTML and CSS reload, and injects stylesheets without a page refresh. 

You can also use a [script snippet](http://feedback.livereload.com/knowledgebase/articles/87979-how-do-i-choose-the-best-integration-method-) instead of the LiveReload browser extension. 

## index.html

Up until now, we haven't had to write any HTML! If you want to, though, you can drop one in the same folder that you are serving budō from, and it will use that instead of a dynamically generated index.

## local installation

Although global install gets us up and running quickly, it's preferred to save these tools as `devDependencies` in your projects so that others cloning your repo are working with the same versions as you. To do that, you need a `package.json`, which you can create like so:

```sh
npm init
```

Then, you can save the tools locally: 

```sh
npm install budo watchify garnish --save-dev
```

You can't run local tools with a simple terminal command; instead, we need to use [npm-scripts](https://docs.npmjs.com/misc/scripts). Open up your package.json and update `"scripts"` so it looks like this:

```sh
  "scripts": {
    "dev": "budo index.js -o bundle.js --live | garnish"
  },
```

Now users cloning your repo can run the following to start serving the file:

```sh
npm install
npm run dev
```