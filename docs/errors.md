# error reporting

By default, bundle errors will be printed to `stdout` (terminal) and also printed to the browser console on reload<sup>[[1]](https://github.com/substack/watchify/blob/ffaf7ec048905f707ba1876579dc7082f1d50de5/bin/cmd.js#L27-L29)</sup>
. 

For clearer error reporting, you can use the [errorify](https://github.com/zertosh/errorify) plugin. This will write the error to the DOM with the problematic file and line number.

```sh
# install
npm install errorify --save-dev

# include it with --plugin or -p
budo index.js --live -p errorify | garnish
```

Using [babelify](https://www.npmjs.com/package/babelify) and errorify together, the error message looks like this:

![enhanced](http://i.imgur.com/Q4DLQBQ.png)

It uses the following CSS style:

```css
body > .errorify {
  color: red;
  padding: 5px 10px;
}
```
