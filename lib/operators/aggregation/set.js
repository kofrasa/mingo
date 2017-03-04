
var setOperators = {
  /**
   * Returns true if two sets have the same elements.
   * @param obj
   * @param expr
   */
  $setEquals: function (obj, expr) {
    var args = computeValue(obj, expr, null)
    var xs = unique(args[0])
    var ys = unique(args[1])
    return xs.length === ys.length && xs.length === intersection(xs, ys).length
  },

  /**
   * Returns the common elements of the input sets.
   * @param obj
   * @param expr
   */
  $setIntersection: function (obj, expr) {
    var args = computeValue(obj, expr, null)
    return intersection(args[0], args[1])
  },

  /**
   * Returns elements of a set that do not appear in a second set.
   * @param obj
   * @param expr
   */
  $setDifference: function (obj, expr) {
    var args = computeValue(obj, expr, null)
    return args[0].filter(notInArray.bind(null, args[1]))
  },

  /**
   * Returns a set that holds all elements of the input sets.
   * @param obj
   * @param expr
   */
  $setUnion: function (obj, expr) {
    var args = computeValue(obj, expr, null)
    return union(args[0], args[1])
  },

  /**
   * Returns true if all elements of a set appear in a second set.
   * @param obj
   * @param expr
   */
  $setIsSubset: function (obj, expr) {
    var args = computeValue(obj, expr, null)
    return intersection(args[0], args[1]).length === args[0].length
  },

  /**
   * Returns true if any elements of a set evaluate to true, and false otherwise.
   * @param obj
   * @param expr
   */
  $anyElementTrue: function (obj, expr) {
    // mongodb nests the array expression in another
    var args = computeValue(obj, expr, null)[0]
    return args.some(truthy)
  },

  /**
   * Returns true if all elements of a set evaluate to true, and false otherwise.
   * @param obj
   * @param expr
   */
  $allElementsTrue: function (obj, expr) {
    // mongodb nests the array expression in another
    var args = computeValue(obj, expr, null)[0]
    return args.every(truthy)
  }
}
