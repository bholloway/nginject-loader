'use strict';

var esprimaTools = require('./esprima-tools'),
    test         = require('./ast-tests');

/**
 * Add explicit dependency statements to the node.
 * @param {object} node An esprima AST function-type node
 */
function processNode(node) {

  // check if the function is part of a variable assignment
  var isVarAssignment = (node.parent.type === 'VariableDeclarator');

  // the parameters of the function, converted to literal strings
  var params = node.params
    .map(paramToLiteral);

  // [ 'arg', ..., function(arg) {} ]
  //  place inline
  if ((node.type === 'FunctionExpression') && !isVarAssignment) {
    esprimaTools.nodeSplicer(node)({
      parent  : node.parent,
      type    : 'ArrayExpression',
      elements: params.concat(node)
    });
  }

  // fn.$inject = [ 'arg', ... ]
  //  hoist before any intervening return statement
  else {
    var appendTo = isVarAssignment ? node.parent.parent : node;
    esprimaTools.nodeSplicer(appendTo, offset)({
      type      : 'ExpressionStatement',
      expression: {
        type    : 'AssignmentExpression',
        operator: '=',
        left    : {
          type    : 'MemberExpression',
          computed: false,
          object  : {
            type: 'Identifier',
            name: node.id.name
          },
          property: {
            type: 'Identifier',
            name: '$inject'
          }
        },
        right   : {
          type    : 'ArrayExpression',
          elements: params
        }
      }
    });
  }
}

module.exports = processNode;

/**
 * Offset function for $inject type annotateion.
 * @param {Array} array The array that we are splicing
 * @param {Object} node The node that we need to offset relative to
 */
function offset(array, node) {
  var nodeIndex = array.indexOf(node);
  var returnIndex = array
    .map(test.isReturnStatement)
    .indexOf(true);
  return (returnIndex < 0) ? +1 : (returnIndex > nodeIndex) ? +1 : (returnIndex - nodeIndex - 1);
}

/**
 * Clone a simple nodes with type and name.
 * @param {{type:string, name:string}} node The node to clone
 * @returns {{type:string, name:string}} A copy of the original node
 */
function paramToLiteral(node) {
  return {
    type : 'Literal',
    value: node.name
  };
}