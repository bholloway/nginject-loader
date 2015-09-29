'use strict';

var esprimaTools = require('browserify-esprima-tools');

var testNode = require('./ast-tests');

/**
 * Find functions that are obvious angular entities.
 * @param {object} ast An esprima syntax tree
 */
function inferAngular(ast) {
  return esprimaTools.breadthFirst(ast)
    .map(getAnnotationCandidates)
    .filter(Boolean)
    .map(followReference)
    .filter(Boolean);
}

module.exports = inferAngular;

/**
 * Find inject candidates
 * @param {object} node An esprima syntax tree
 * @returns {object|null} A node that may need annotation, or null where not suitable
 */
function getAnnotationCandidates(node) {
  var callExpression = testNode.isModuleExpression(node) && node.parent;
  if (callExpression) {
    return callExpression['arguments']
      .filter(testNode.anyOf(testNode.isFunction, testNode.isIdentifier))
      .pop();
  } else {
    return null;
  }
}

/**
 * Given a function or reference that points to one will resolve to the function node.
 * @param {object} node An esprima AST node of type function or identifier
 * @returns {object|null} The AST node for the function that was resolved, or null if unresolved
 */
function followReference(node) {

  // immediate function
  if (testNode.isFunction(node)) {
    return node;
  }
  // follow identifier
  else {
    var name   = node.name,
        result = null;

    // find the next highest scope and search for declaration
    while (node.parent && !result) {
      node = node.parent;
      var isBlock = testNode.isBlockOrProgram(node);
      if (isBlock) {

        // look at the nodes breadth first and take the first result
        esprimaTools.breadthFirst(node)
          .some(function eachNode(subNode) {
            switch (subNode.type) {
              case 'FunctionDeclaration':
                if (subNode.id.name === name) {
                  result = subNode;
                }
                break;
              case 'VariableDeclarator':
                if (subNode.id.name === name) {
                  result = subNode.init;
                }
                break;
              case 'AssignmentExpression':
                if ((subNode.left.type === 'Identifier') && (subNode.left.name === name)) {
                  result = subNode.right;
                }
                break;
            }
            return !!result;
          });
      }
    }

    // recurse the result until we find a function
    return result ? followReference(result) : null;
  }

}