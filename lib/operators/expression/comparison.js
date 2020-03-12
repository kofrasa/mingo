import { computeValue } from '../../internal'
import { simpleOperators } from '../query'

function createComparison (op) {
  return (obj, expr) => {
    let args = computeValue(obj, expr)
    return simpleOperators[op](args[0], args[1])
  }
}

export const $eq = createComparison('$eq')
export const $ne = createComparison('$ne')
export const $gt = createComparison('$gt')
export const $lt = createComparison('$lt')
export const $gte = createComparison('$gte')
export const $lte = createComparison('$lte')
export const $nin = createComparison('$nin')

/**
 * Comparison operators. Must be exported after const delcarations above
 */
export const comparisonOperators = {
  $cmp,
  $eq,
  $gt,
  $gte,
  $lt,
  $lte,
  $ne,
  $nin
}

/**
 * Compares two values and returns the result of the comparison as an integer.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $cmp (obj, expr) {
  let args = computeValue(obj, expr)
  if (args[0] > args[1]) return 1
  if (args[0] < args[1]) return -1
  return 0
}