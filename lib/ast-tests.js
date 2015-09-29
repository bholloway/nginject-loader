'use strict';

module.exports = {
  not               : not,
  anyOf             : anyOf,
  isModuleExpression: isModuleExpression,
  isAngularDotModule: isAngularDotModule,
  isFunction        : isFunction,
  isIdentifier      : isIdentifier,
  isIFFE            : isIFFE,
  isFunctionNotIFFE : isFunctionNotIFFE,
  isReturnStatement : isReturnStatement,
  isBlockOrProgram  : isBlockOrProgram,
  isGeneratedCode   : isGeneratedCode
};

/**
 * Invert the given test method.
 * @param {function} method A test method
 * @returns {function} A test method that is the inverse of the given method
 */
function not(method) {
  return function notTest() {
    var args = Array.prototype.slice.call(arguments);
    return !method.apply(null, args);
  }
}

/**
 * Create a test that passes if all given tests pass.
 * @param {...function} tests Any number of test functions
 * @returns {function} A test function
 */
function anyOf() {
  var tests = Array.prototype.slice.call(arguments);
  return function isAnyTests(node) {
    return tests.some(function evaluateTest(test) {
      return (typeof test === 'function') && test(node);
    });
  }
}

/**
 * Tests whether the given node is a member expression on one of the angular module methods.
 * @param {object} node An esprima AST node
 * @returns {boolean} True on expression, else False
 */
function isModuleExpression(node) {
  var NAMES = [
    'provider', 'factory', 'service', 'value', 'constant', 'animation',
    'filter', 'controller', 'directive', 'config', 'run'
  ];
  // consider: angular.module().config().run()
  //  both the last 2 terms should match, however the run() term is member of config() which is member of module()
  //  we therefore need recursion to match the last term
  return !!node &&
    (node.type === 'MemberExpression') &&
    (node.property.type === 'Identifier') && (NAMES.indexOf(node.property.name) >= 0) &&
    (node.object.type === 'CallExpression') &&
    (isAngularDotModule(node.object.callee) || isModuleExpression(node.object.callee));
}

/**
 * Tests whether the given node is the exact member expression <code>angular.module</code>.
 * @param {object} node An esprima AST node
 * @returns {boolean} True on expression, else False
 */
function isAngularDotModule(node) {
  return !!node &&
    (node.type === 'MemberExpression') &&
    (node.object.type === 'Identifier') && (node.object.name === 'angular') &&
    (node.property.type === 'Identifier') && (node.property.name === 'module');
}

/**
 * Test whether the given esprima node is a function declaration or expression.
 * @param {{type:string}} node An esprima AST node to test
 * @returns {boolean} True on match, else False
 */
function isFunction(node) {
  return !!node && /^Function(Declaration|Expression)$/.test(node.type);
}

/**
 * Tests whether the given node is a variable identifier.
 * @param {object} node An esprima AST node
 * @returns {boolean} True on match, else False
 */
function isIdentifier(node) {
  return !!node && /^Identifier$/.test(node.type);
}

/**
 * Tests whether the given node is a return statement.
 * @param {object} node An esprima AST node
 * @returns {boolean} True on match, else False
 */
function isReturnStatement(node) {
  return !!node && /^ReturnStatement$/.test(node.type);
}

/**
 * Test whether the given esprima node is an IFFE.
 * @param {{type:string}} node An esprima AST node to test
 * @returns {boolean} True on match, else False
 */
function isIFFE(node) {
  return isFunction(node) && node.parent && (node.parent.type === 'CallExpression') && (node.parent.callee === node);
}

/**
 * Test whether the given esprima node is a function declaration or expression node but not an IFFE.
 * @param {{type:string}} node An esprima AST node to test
 * @returns {boolean} True on match, else False
 */
function isFunctionNotIFFE(node) {
  return isFunction(node) && !isIFFE(node);
}

/**
 * Test whether the given esprima node is a block statement or program.
 * @param {{type:string}} node An esprima AST node to test
 * @returns {boolean} True on match, else False
 */
function isBlockOrProgram(node) {
  return !!node && /^(Program|BlockStatement)$/.test(node.type);
}

/**
 * Test whether the given esprima node is a generated code.
 * Requires <code>loc</code> type source locations.
 * @param {{loc:object}} node An esprima AST node to test
 * @returns {boolean}
 */
function isGeneratedCode(node) {
  return !node.loc;
}
