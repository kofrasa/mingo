import { assert, isNumber } from '../../util'

/**
 * Randomly selects the specified number of documents from its input.
 * https://docs.mongodb.com/manual/reference/operator/aggregation/sample/
 *
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {*}
 */
export function $sample (collection, expr) {
  let size = expr.size
  assert(isNumber(size), '$sample size must be a positive integer')

  let result = []
  let len = collection.length
  for (let i = 0; i < size; i++) {
    let n = Math.floor(Math.random() * len)
    result.push(collection[n])
  }
  return result
}