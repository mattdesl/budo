# error reporting

By default, bundle errors will be printed to `stdout` (terminal) and also injected into the browser console<sup>[[1]](https://github.com/substack/watchify/blob/ffaf7ec048905f707ba1876579dc7082f1d50de5/bin/cmd.js#L27-L29)</sup>
. 

For clearer error reporting, you can use the [errorify](https://github.com/zertosh/errorify) plugin. This will write the error to the DOM as well as console.

```sh
budo index.js --live -p errorify | garnish
```

![enhanced](http://i.imgur.com/Q4DLQBQ.png)

The above uses [babelify](https://www.npmjs.com/package/babelify) (which further improves the error message) and a custom CSS style for errorify,


```sh
budo index.js --live -t babelify -p errorify | garnish
```

