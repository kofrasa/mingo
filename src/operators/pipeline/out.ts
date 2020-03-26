import { assert, isArray } from '../../util'
import { Iterator } from '../../lazy'


/**
 * Takes the documents returned by the aggregation pipeline and writes them to a specified collection.
 *
 * Unlike the $out operator in MongoDB, this operator can appear in any position in the pipeline and is
 * useful for collecting intermediate results of an aggregation operation.
 *
 * @param collection
 * @param expr
 * @param opt
 * @returns {*}
 */
export function $out(collection: Iterator, expr: any, opt?: object): Iterator {
  assert(isArray(expr), '$out expression must be an array')
  return collection.map(o => {
    expr.push(o)
    return o // passthrough
  })
}