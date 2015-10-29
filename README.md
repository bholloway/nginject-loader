# ngInject Loader

[![NPM](https://nodei.co/npm/nginject-loader.png)](http://github.com/bholloway/nginject-loader)

Webpack loader where explicit @ngInject comment creates pre-minification $inject property

Handles explicit annotation in comment blocks which [ng-annotate](https://www.npmjs.com/package/ng-annotate-loader) cannot when there is ES6 syntax involved.

However it is quite **slow** compared to ng-annotate. It is recommended that you use the [`"ngInject";` (directive prologue) syntax](https://github.com/olov/ng-annotate#es6-and-typescript-support) with ng-annotate alone.

The speed deficit is most pronounced when inferring angular structures (`inferAngular` option). By default you should disable this and **also use ng-annotate**. But if you use inference you will find it not as fully featured as ng-annotate.

## Limitation

This loader is primarily for support of block comment `@ngInject` in legacy code. If a solution to migrate such code to `"ngInject"` syntax becomes available this loader may be **depricated**.

Please comment on [this issue](https://github.com/bholloway/nginject-loader/issues/2) if your use case cannot suffer migration to `"ngInject"` syntaxv .


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
        loaders: ['ng-annotate', 'nginject']
      }
    ]
  }
};
```

### Options

* `inferAngular` allows basic angular structures to be annotated without explicit annotation. Does **not** include ui-router structures such as `resolve`. Disabled by default; you may **also need ng-annotate** unless you enable this option.