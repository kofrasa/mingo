import { assert, isString } from '../../util'
import { Lazy } from '../../lazy'

/**
 * Returns a document that contains a count of the number of documents input to the stage.
 *
 * @param  {Array} collection
 * @param  {String} expr
 * @param {Object} opt Pipeline options
 * @return {Object}
 */
export function $count (collection, expr, opt) {
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