'use strict';

var WHITE_LIST = /^(?!id|loc|comments|parent).*$/;

module.exports = {
  orderNodes       : orderNodes,
  depthFirst       : depthFirst,
  breadthFirst     : breadthFirst,
  nodeSplicer      : nodeSplicer,
  associateComments: associateComments
};

/**
 * Sort given node an all children by sort index (where present) or source map location.
 * Includes comments, creates parent reference, and sets sort index if not present.
 * @param {object} ast The esprima syntax tree
 */
function orderNodes(ast) {
  var comments   = Array.isArray(ast.comments) ? ast.comments.slice() : [],
      comparator = ('sortIndex' in ast) ? compareIndex : compareLocation;
  return comments
    .concat(depthFirst(ast, ast.parent))
    .sort(comparator)
    .map(setSortIndex);
}

/**
 * List the given node and all children, depth first.
 * @param {object} node An esprima node
 * @param {object|undefined} [parent] The parent of the given node, where known
 * @returns {Array} A list of nodes
 */
function depthFirst(node, parent) {
  var results = [];
  if (node && (typeof node === 'object')) {

    // valid node so push it to the list and set new parent
    //  don't overwrite parent if one was not given
    if ('type' in node) {
      if (parent !== undefined) {
        node.parent = parent;
      }
      parent = node;
      results.push(node);
    }

    // recurse object members using nested function call
    for (var key in node) {
      if (WHITE_LIST.test(key)) {
        var value = node[key];
        if (value && (typeof value === 'object')) {
          results.push.apply(results, depthFirst(value, parent));
        }
      }
    }
  }
  return results;
}

/**
 * List the given node and all children, breadth first.
 * @param {object} node An esprima node
 * @param {object|undefined} [parent] The parent of the given node, where known
 * @returns {Array} A list of nodes
 */
function breadthFirst(node, parent) {
  var results = [];
  if (node && (typeof node === 'object')) {

    // begin the queue with the given node
    var queue = [{
      node  : node,
      parent: parent
    }];
    while (queue.length) {

      // pull the next item from the front of the queue
      var item = queue.shift();
      node = item.node;
      parent = item.parent;

      // valid node so push it to the list and set new parent
      //  don't overwrite parent if one was not given
      if ('type' in node) {
        if (parent !== undefined) {
          node.parent = parent;
        }
        parent = node;
        results.push(node);
      }

      // recurse object members using the queue
      for (var key in node) {
        if (WHITE_LIST.test(key)) {
          var value = node[key];
          if (value && (typeof value === 'object')) {
            queue.push({
              node  : value,
              parent: parent
            });
          }
        }
      }
    }
  }
  return results;
}

/**
 * Create a setter that will replace the given node or insert relative to it.
 * @param {object} candidate An esprima AST node to match
 * @param {number|function} [offset] 0 to replace, -1 to insert before node, +1 to insert after node
 * @returns {function|null} A setter that will replace the given node or do nothing if not valid
 */
function nodeSplicer(candidate, offset) {
  offset = offset || 0;
  return function setter(value) {
    var found = findReferrer(candidate);
    if (found) {
      var key = found.key;
      var obj = found.object;
      var array = Array.isArray(obj) && obj;
      if (!array) {
        obj[key] = value;
      }
      else if (typeof key !== 'number') {
        throw new Error('A numerical key is required to splice an array');
      }
      else {
        if (typeof offset === 'function') {
          offset = offset(array, candidate, value);
        }
        var index = Math.max(0, Math.min(array.length, key + offset + Number(offset < 0)));
        var remove = Number(offset === 0);
        array.splice(index, remove, value);
      }
    }
  }
}

/**
 * Associate comments with the node that follows them per an <code>annotates</code> property.
 * @param {object} ast An esprima AST with comments array
 * @param {Array} sorted An orded list of esprima nodes
 */
function associateComments(ast, sorted) {
  ast.comments
    .forEach(eachComment);

  function eachComment(comment) {

    // decorate the comment with the node that follows it in the sorted node list
    var index = sorted.indexOf(comment);
    var annotates = sorted[index + 1];
    if (annotates) {
      comment.annotates = annotates;
    }

    // comments generally can't be converted by source-map and won't be considered by sourcemap-to-ast
    delete comment.loc;
  }
}

/**
 * Compare function for nodes with location.
 * @param {object} nodeA First node
 * @param {object} nodeB Second node
 * @returns {number} -1 where a follows b, +1 where b follows a, 0 otherwise
 */
function compareLocation(nodeA, nodeB) {
  var locA = nodeA && nodeA.loc;
  var locB = nodeB && nodeB.loc;
  if (!locA && !locB) {
    return 0;
  }
  else if (Boolean(locA) !== Boolean(locB)) {
    return locA ? +1 : locB ? -1 : 0;
  }
  else {
    return isOrdered(locB.end, locA.start) ? +1 : isOrdered(locA.end, locB.start) ? -1 :  // non-overlapping
      isOrdered(locB.start, locA.start) ? +1 : isOrdered(locA.start, locB.start) ? -1 :   // overlapping
        isOrdered(locA.end, locB.end) ? +1 : isOrdered(locB.end, locA.end) ? -1 :         // enclosed
          0;
  }
}

/**
 * Check the order of the given location tuples.
 * @param {{line:number, column:number}} tupleA The first tuple
 * @param {{line:number, column:number}} tupleB The second tuple
 * @returns {boolean} True where tupleA precedes tupleB
 */
function isOrdered(tupleA, tupleB) {
  return (tupleA.line < tupleB.line) || ((tupleA.line === tupleB.line) && (tupleA.column < tupleB.column));
}

/**
 * Compare function for nodes with sort-index.
 * @param {object} nodeA First node
 * @param {object} nodeB Second node
 * @returns {number} -1 where a follows b, +1 where b follows a, 0 otherwise
 */
function compareIndex(nodeA, nodeB) {
  var indexA = nodeA && nodeA.sortIndex;
  var indexB = nodeB && nodeB.sortIndex;
  if (!indexA && !indexB) {
    return 0;
  }
  else if (Boolean(indexA) !== Boolean(indexB)) {
    return indexA ? +1 : indexB ? -1 : 0;
  }
  else {
    return indexA - indexB;
  }
}

/**
 * Set a node with a <code>sortIndex</code> where not already set.
 * @param {object} node The node to set
 * @param {number} index The index to set
 * @returns {object} The given value
 */
function setSortIndex(node, index) {
  if (!('sortIndex' in node)) {
    node.sortIndex = index;
  }
  return node;
}

/**
 * Find the object and field that refers to the given node.
 * @param {object} candidate An esprima AST node to match
 * @param {object} [container] Optional container to search within or the candidate parent where omitted
 * @returns {{object:object, key:*}} The object and its key where the candidate node is a value
 */
function findReferrer(candidate, container) {
  var result;
  if (candidate) {

    // initially for the parent of the candidate node
    container = container || candidate.parent;

    // consider keys in the node until we have a result
    var keys = getKeys(container);
    for (var i = 0; !result && (i < keys.length); i++) {
      var key = keys[i];
      if (WHITE_LIST.test(key)) {
        var value = container[key];

        // found
        if (value === candidate) {
          result = {
            object: container,
            key   : key
          };
        }
        // recurse
        else if (value && (typeof value === 'object')) {
          result = findReferrer(candidate, value);
        }
      }
    }
  }

  // complete
  return result;
}

/**
 * Get the keys of an object as strings or those of an array as integers.
 * @param {object|Array} container A hash or array
 * @returns {Array.<string|number>} The keys of the container
 */
function getKeys(container) {
  if (typeof container === 'object') {
    return Array.isArray(container) ? container.map(arrayIndex) : Object.keys(container);
  } else {
    return [];
  }

  function arrayIndex(value, i) {
    return i;
  }
}