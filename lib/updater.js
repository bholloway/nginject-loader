'use strict';

var esprimaTools = require('browserify-esprima-tools');

var testNode     = require('./ast-tests'),
    inferAngular = require('./infer-angular'),
    processNode  = require('./process-node');

/**
 * Create an updater function for the esprima transform with the given error handler
 * @param {function} [errorFn] Optional error handler function
 * @param {{inferAngular:boolean} [options] Optional options hash
 * @returns {function(string, object):object} A method that transforms the esprima tree
 */
module.exports = function updater(errorFn, options) {
  errorFn = errorFn || new Function();
  options = options || {};
  return updaterProper;

  /**
   * The updater function for the esprima transform
   * @param {object} ast The esprima syntax tree
   * @returns {object} The transformed esprima syntax tree
   */
  function updaterProper(ast) {
    if (ast.comments) {
      ast.comments
        .filter(testDocTag)
        .map(getAnnotatedNode)
        .concat(options.inferAngular && inferAngular(ast))    // find the items that are not explicitly annotated
        .filter(truthyFirstOccurance)                         // ensure unique values
        .forEach(processNode);
    } else {
      errorFn('Esprima AST is required to have top-level comments array');
    }
    return ast;
  }

  /**
   * Get the node that is annotated by the comment or throw if not present.
   * @throws {Error} Where comment does not annotate a node
   * @param {object} comment The comment node
   */
  function getAnnotatedNode(comment) {

    // find the first function declaration or expression following the annotation
    var result;
    if (comment.annotates) {
      var candidateTrees;

      // consider the context the block is in (i.e. what is its parent)
      var parent = comment.annotates.parent;

      // consider nodes from the annotated node forward
      //  include the first non-generated node and all generated nodes preceding it
      if (testNode.isBlockOrProgram(parent)) {
        var body = parent.body;
        var index = body.indexOf(comment.annotates);
        var candidates = body.slice(index);
        var length = candidates.map(testNode.isGeneratedCode).indexOf(false) + 1;
        candidateTrees = candidates.slice(0, length || candidates.length);
      }
      // otherwise we can only consider the given node
      else {
        candidateTrees = [comment.annotates];
      }

      // try the nodes
      while (!result && candidateTrees.length) {
        result = esprimaTools
          .orderNodes(candidateTrees.shift())
          .filter(testNode.isFunctionNotIFFE)
          .shift();
      }
    }

    // throw where not valid
    if (result) {
      return result;
    } else {
      errorFn('Doc-tag @ngInject does not annotate anything');
    }
  }
};

/**
 * Test the comment content for the <code>@ngInject</code> doctag.
 * @param {object} comment The comment node
 */
function testDocTag(comment) {
  return /@ngInject/i.test(comment.value);
}

/**
 * Test whether the given value is the first occurance in the array.
 * @param {*} value The value to test
 * @param {number} i The index of the value in the array
 * @param {Array} array The array the value is within at the given index
 */
function truthyFirstOccurance(value, i, array) {
  return !!value && (array.indexOf(value) === i);
}