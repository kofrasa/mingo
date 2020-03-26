import { computeValue } from '../../internal'
import * as predicates from '../predicates'
import { Predicate } from '../../util'

function createComparison(f: Predicate<any>) {
  return (obj: object, expr: any) => {
    let args = computeValue(obj, expr)
    return f(args[0], args[1])
  }
}

export const $eq = createComparison(predicates.$eq)
export const $gt = createComparison(predicates.$gt)
export const $gte = createComparison(predicates.$gte)
export const $lt = createComparison(predicates.$lt)
export const $lte = createComparison(predicates.$lte)
export const $ne = createComparison(predicates.$ne)
export const $nin = createComparison(predicates.$nin)

/**
 * Compares two values and returns the result of the comparison as an integer.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $cmp(obj: object, expr: any): any {
  let args = computeValue(obj, expr)
  if (args[0] > args[1]) return 1
  if (args[0] < args[1]) return -1
  return 0
}