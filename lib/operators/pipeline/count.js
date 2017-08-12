import { assert, isString } from '../../util'

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

  let result = {}
  result[expr] = collection.length
  return result
}