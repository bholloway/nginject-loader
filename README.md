# ngInject Loader

[![NPM](https://nodei.co/npm/nginject-loader.png)](http://github.com/bholloway/nginject-loader)

Webpack loader to migrate from legacy @ngInject pre-minifier syntax to \"ngInject\" syntax

Use in conjunction with [ng-annotate](https://www.npmjs.com/package/ng-annotate-loader) to annotate your AngularJS pre-minification.

## Rationale

The [ng-annotate](https://github.com/olov/ng-annotate) project is the seminal pre-minifier for AngularJS. Initially it used the `@ngInject` annotation doctag but has more recently moved to an `"ngInject"` [directive annotation](https://github.com/olov/ng-annotate#es6-and-typescript-support).

The new annotation syntax plays much better with ES6 and is considered best practice going forward.

However if you have legacy code you will want to keep operating with the `@ngInject` syntax and make a change over time.

This loader reliably detects `@ngInject` annotations following transpilation. It then rewrites to the new `"ngInject"` annotation and offers a deprecation warning.

## Evolution

This loader is now **primarily a migration tool** for legacy `@ngInject` doctag annotation.
 
Previous versions were more of an ng-annotate alternative and will be **deprecated**.

Please comment on [this issue](https://github.com/bholloway/nginject-loader/issues/2) if your use case cannot suffer migration to `"ngInject"` syntax.

## Usage

Refer to the Webpack documentation on [using loaders](http://webpack.github.io/docs/using-loaders.html).

``` javascript
var css = require('!ng-annotate!nginject!./file.js');
```

### Apply via webpack config

It is preferable to adjust your `webpack.config` so to avoid having to prefix every `require()` statement:

``` javascript
module.exports = {
  module: {
    loaders: [
      {
        test   : /\.js$/,
        loaders: ['ng-annotate', 'nginject?deprecate' /*...transpiler? */]
      }
    ]
  }
};
```

Note that the `deprecate` option is shown is strongly encouraged.

If you are using a transpiler then place it before (to the right of) `nginject-loader` as shown.

### Options

* `deprecate` implies that a warning should be generated whenever the loader needs to operate. Use this to help migration from `@ngInject` to `"ngInject"`. It is not activiated by default but is strongly encouraged.

* `sourceMap` generate a source-map.

* `singleQuote` controls the character which is used to deliniate the `"ngInject"` directive.
