'use strict';

var loaderUtils    = require('loader-utils'),
    codegen        = require('escodegen'),
    esprima        = require('esprima'),
    sourcemapToAst = require('sourcemap-to-ast');

var esprimaTools = require('./lib/esprima-tools'),
    updater      = require('./lib/updater');

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
      options  = loaderUtils.parseQuery(this.query);

  // parse code to AST using esprima
  var ast = esprima.parse(content, {
    loc    : true,
    comment: true,
    source : filename
  });

  // sort nodes before changing the source-map
  var sorted = esprimaTools.orderNodes(ast);

  // associate comments with nodes they annotate before changing the sort map
  esprimaTools.associateComments(ast, sorted);

  // make sure the AST has the data from the original source map
  var useSourceMap = sourceMap && options.sourceMap;
  if (useSourceMap) {
    sourcemapToAst(ast, sourceMap);
  }

  // update the AST
  var updated = updater(this.emitError)(ast, options);

  // generate compressed code from the AST
  var output = codegen.generate(updated, {
        sourceMap        : useSourceMap,
        sourceMapWithCode: useSourceMap,
        format           : options.format || {}
      });

  // complete
  if (useSourceMap) {
    var outputMapObj = JSON.parse(output.map.toString());
    this.callback(null, output.code, outputMapObj);
  } else {
    return output;
  }
};