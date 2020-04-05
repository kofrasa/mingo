import { assert, isString } from '../../util'
import { Lazy, Iterator } from '../../lazy'
import { Options } from '../../core'


/**
 * Returns a document that contains a count of the number of documents input to the stage.
 *
 * @param {Array} collection
 * @param {String} expr
 * @param {Options} options
 * @return {Object}
 */
export function $count(collection: Iterator, expr: any, options: Options): Iterator {
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