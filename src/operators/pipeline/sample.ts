// $sample operator -  https://docs.mongodb.com/manual/reference/operator/aggregation/sample/

import { assert, isNumber } from '../../util'
import { Iterator } from '../../lazy'
import { Options } from '../../core'


/**
 * Randomly selects the specified number of documents from its input. The given iterator must have finite values
 *
 * @param  {Iterator} collection
 * @param  {Object} expr
 * @param  {Options} options
 * @return {*}
 */
export function $sample(collection: Iterator, expr: any, options: Options): Iterator {
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