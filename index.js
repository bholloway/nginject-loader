'use strict';

var loaderUtils = require('loader-utils'),
    getUpdater  = require('browserify-nginject/lib/get-updater'),
    processSync = require('browserify-esprima-tools').processSync,
    convert     = require('convert-source-map');

/**
 * Webpack loader where explicit @ngInject comment creates pre-minification $inject property.
 * @param {string} content Css content
 * @param {object} sourceMap The source-map
 * @returns {string|String}
 */
module.exports = function loader(content, sourceMap) {
  /* jshint validthis:true */

  // path of the file being processed
  var filename = this.resourcePath,
      options  = loaderUtils.parseQuery(this.query);

  // loader result is cacheable
  this.cacheable();

  // process
  try {
    var output    = processSync(filename, content, getUpdater(this.emitError)),
        converter = convert.fromSource(output),
        source    = output.replace(/\/(?:\/|\*)[@#]\s+sourceMappingURL[^]*$/, ''),
        map       = converter && converter.toObject();
    this.callback(null, source, map);
  } catch (exception) {
    this.emitError(exception);
  }
};