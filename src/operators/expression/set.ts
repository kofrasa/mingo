/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { union, unique, intersection, notInArray, truthy } from '../../util'
import { computeValue, Options } from '../../core'

/**
 * Returns true if two sets have the same elements.
 * @param obj
 * @param expr
 */
export function $setEquals(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  let xs = unique(args[0])
  let ys = unique(args[1])
  return xs.length === ys.length && xs.length === intersection(xs, ys).length
}

/**
 * Returns the common elements of the input sets.
 * @param obj
 * @param expr
 */
export function $setIntersection(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  return intersection(args[0], args[1])
}

/**
 * Returns elements of a set that do not appear in a second set.
 * @param obj
 * @param expr
 */
export function $setDifference(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  return args[0].filter(notInArray.bind(null, args[1]))
}

/**
 * Returns a set that holds all elements of the input sets.
 * @param obj
 * @param expr
 */
export function $setUnion(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  return union(args[0], args[1])
}

/**
 * Returns true if all elements of a set appear in a second set.
 * @param obj
 * @param expr
 */
export function $setIsSubset(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  return intersection(args[0], args[1]).length === args[0].length
}

/**
 * Returns true if any elements of a set evaluate to true, and false otherwise.
 * @param obj
 * @param expr
 */
export function $anyElementTrue(obj: object, expr: any, options: Options): any {
  // mongodb nests the array expression in another
  let args = computeValue(obj, expr, null, options)[0]
  return args.some(truthy)
}

/**
 * Returns true if all elements of a set evaluate to true, and false otherwise.
 * @param obj
 * @param expr
 */
export function $allElementsTrue(obj: object, expr: any, options: Options): any {
  // mongodb nests the array expression in another
  let args = computeValue(obj, expr, null, options)[0]
  return args.every(truthy)
}
