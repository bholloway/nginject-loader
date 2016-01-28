'use strict';

var path = require('path');

var loaderUtils = require('loader-utils'),
    migrate     = require('nginject-migrate');

var PACKAGE_NAME = require('./package.json').name;

/**
 * Webpack loader where explicit @ngInject comment creates pre-minification $inject property.
 * @param {string} content JS content
 * @param {object} sourceMap The source-map
 * @returns {string|String}
 */
function loader(content, sourceMap) {
  /* jshint validthis:true */

  // loader result is cacheable
  this.cacheable();

  // path of the file being processed
  var filename = path.relative(this.options.context || process.cwd(), this.resourcePath).replace(/\\/g, '/'),
      options  = loaderUtils.parseQuery(this.query),
      useMap   = loader.sourceMap || options.sourceMap;

  // make sure the AST has the data from the original source map
  var pending = migrate.processSync(content, {
    filename : filename,
    sourceMap: useMap && (sourceMap || true),
    quoteChar: options.singleQuote ? '\'' : '"'
  });

  // emit deprecation warning
  if ((pending.isChanged) && (options.deprecate)) {
    var text = '  ' + PACKAGE_NAME + ': @ngInject doctag is deprecated, use "ngInject" string directive instead';
    this.emitWarning(text);
  }

  // emit errors
  if (pending.errors.length) {
    var text = pending.errors.map(indent).join('\n');
    this.emitError(text);
  }

  // complete
  if (useMap) {
    this.callback(null, pending.content, pending.sourceMap);
  } else {
    return pending.content;
  }
}

module.exports = loader;

function indent(value) {
  return '  ' + value;
}