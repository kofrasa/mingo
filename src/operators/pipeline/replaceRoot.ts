import { assert, isObject } from '../../util'
import { computeValue } from '../../core'
import { Iterator } from '../../lazy'


/**
 * Replaces a document with the specified embedded document or new one.
 * The replacement document can be any valid expression that resolves to a document.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/replaceRoot/
 *
 * @param  {Array} collection
 * @param  {Object} expr
 * @param  {Object} opt
 * @return {*}
 */
export function $replaceRoot(collection: Iterator, expr: any, opt?: object): Iterator {
  return collection.map(obj => {
    obj = computeValue(obj, expr.newRoot)
    assert(isObject(obj), '$replaceRoot expression must return an object')
    return obj
  })
}