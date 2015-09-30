# ngInject Loader

[![NPM](https://nodei.co/npm/nginject-loader.png)](http://github.com/bholloway/nginject-loader)

Webpack loader where explicit @ngInject comment creates pre-minification $inject property

Handles explicit annotation more gracefully than [ng-annotate](https://www.npmjs.com/package/ng-annotate-loader). However it is slower when inferring angular structures (`inferAngular` option). By default you may **also need ng-annotate**.

## Usage

Refer to the Webpack documentation on [using loaders](http://webpack.github.io/docs/using-loaders.html).

``` javascript
var css = require('!nginject!./file.js');
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