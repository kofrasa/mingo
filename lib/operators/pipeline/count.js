import { assert, isString } from '../../util'
import { Lazy } from '../../lazy'

/**
 * Returns a document that contains a count of the number of documents input to the stage.
 * @param  {Array} collection
 * @param  {String} expr
 * @return {Object}
 */
export function $count (collection, expr) {
  assert(
    isString(expr) && expr.trim() !== '' && expr.indexOf('.') === -1 && expr.trim()[0] !== '$',
    'Invalid expression value for $count'
  )

  let o = {}
  o[expr] = 0
  let done = false

  return Lazy(() => {
    if (done) return { done: true }
    let res = collection.reduce((memo,n) => {
      memo[expr] += 1
      return memo
    }, o)
    done = true
    return { value: res, done: false }
  }).one()
}