import { assert, isString, memoize } from '../../util'
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

  return Lazy(() => {
    let o = {}
    o[expr] = collection.size()
    return { value: o, done: false }
  }).first()
}