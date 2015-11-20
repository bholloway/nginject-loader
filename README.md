# ngInject Loader

[![NPM](https://nodei.co/npm/nginject-loader.png)](http://github.com/bholloway/nginject-loader)

Webpack loader to migrate from legacy @ngInject pre-minifier syntax to "ngInject" syntax

Use in conjunction with [ng-annotate](https://www.npmjs.com/package/ng-annotate-loader) to annotate your AngularJS code pre-minification.

## Rationale

The [ng-annotate](https://github.com/olov/ng-annotate) project is the seminal pre-minifier for AngularJS. Initially it used the `@ngInject` annotation doctag but has more recently moved to an `"ngInject"` [directive prologue](https://github.com/olov/ng-annotate#es6-and-typescript-support) annotation.

The new annotation syntax plays much better with ES6 and is considered best practice going forward.

If you have legacy code you will want to keep operating with the `@ngInject` syntax and make the change over time.

This loader reliably detects `@ngInject` annotations following transpilation. It then rewrites to the new `"ngInject"` annotation and offers a deprecation warning.

## Angular best practice

As default this loader will not invoke the `deprecate` option. You will find that it identifies `@ngInject` in transpiled code more effectively than [ng-annotate](https://github.com/olov/ng-annotate) alone.

However it is best practice to migrate your code to the `"ngInject"` [directive prologue](https://github.com/olov/ng-annotate#es6-and-typescript-support) annotation. As such the `deprecate` option is strongly encouraged.

But ultimately this seperates best from good. Both are lightyears ahead of creating Arrays of property strings yourself. However you will want to (eventually) make the change as eliminating this loader will improve your compile time.

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

Note that the `deprecate` option as shown is strongly encouraged.

If you are using a transpiler then place it before (to the right of) `nginject-loader` as shown.

### Options

* `deprecate` implies that a warning should be generated whenever the loader needs to operate. Use this to help migration from `@ngInject` to `"ngInject"`. It is not activiated by default but is strongly encouraged.

* `sourceMap` generate a source-map.

* `singleQuote` controls the character which is used to deliniate the `"ngInject"` directive.


## Version 2.x vs 1.x
 
The [issue #1](https://github.com/bholloway/nginject-loader/issues/1) prompted a roll change of this loader and [version 1](https://github.com/bholloway/nginject-loader/releases/tag/1.0.0) has now been depricated.

Version 1.x the loader was a more complete pre-minification solution, overlapping the functionality of [ng-annotate](https://www.npmjs.com/package/ng-annotate-loader). Following version 2 this loader acts as a pre-processor to [ng-annotate](https://www.npmjs.com/package/ng-annotate-loader) for the purpose of migrating annotations. Overall there should be no capability gap as a result of the change.

Please comment on [this issue](https://github.com/bholloway/nginject-loader/issues/2) if your use case cannot suffer migration to the `"ngInject"` [directive prologue](https://github.com/olov/ng-annotate#es6-and-typescript-support) annotation syntax.