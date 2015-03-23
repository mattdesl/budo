# errorify plugin

By default, bundle errors will be printed to `stdout` (terminal) and also injected into the browser console<sup>[[1]](https://github.com/substack/watchify/blob/ffaf7ec048905f707ba1876579dc7082f1d50de5/bin/cmd.js#L27-L29)</sup>
. 

For clearer error reporting, you can use the [errorify](https://github.com/zertosh/errorify) plugin. This will write the error to the DOM as well as console.

```
budo index.js --live -p errorify | garnish
```

Some tools like [babelify](https://www.npmjs.com/package/babelify) can also improve the error messages.

![enhanced](http://i.imgur.com/Q4DLQBQ.png)

The above uses babelify and the following CSS style:

