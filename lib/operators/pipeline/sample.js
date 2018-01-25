import { assert, isNumber } from '../../util'
import { Lazy } from '../../lazy'

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

  return collection.transform(xs => {
    let len = xs.length
    let i = -1
    return () => {
      if (++i === size) return { done: true }
      let n = Math.floor(Math.random() * len)
      return { value: xs[n], done: false }
    }
  })
}