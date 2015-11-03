'use strict';

var loaderUtils = require('loader-utils'),
    migrate     = require('nginject-migrate');

/**
 * Webpack loader where explicit @ngInject comment creates pre-minification $inject property.
 * @param {string} content Css content
 * @param {object} sourceMap The source-map
 * @returns {string|String}
 */
module.exports = function loader(content, sourceMap) {
  /* jshint validthis:true */

  // loader result is cacheable
  this.cacheable();

  // path of the file being processed
  var filename = this.resourcePath,
      options  = loaderUtils.parseQuery(this.query),
      useMap   = loader.sourceMap || options.sourceMap;

  // make sure the AST has the data from the original source map
  var pending = migrate.processSync(content, {
    filename : filename,
    sourceMap: useMap && (sourceMap || true),
    quoteChar: options.quoteChar
  });

  // complete
  if (useMap) {
    this.callback(null, pending.content, pending.sourceMap);
  } else {
    return pending.content;
  }
};