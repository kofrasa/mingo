import {
  assert,
  each,
  findInsertIndex,
  getType,
  isNil,
  keys
} from '../../util'
import { accumulate, computeValue, traverse } from '../../internal'
import { Lazy } from '../../lazy'

/**
 * Categorizes incoming documents into groups, called buckets, based on a specified expression and bucket boundaries.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/bucket/
 */
export function $bucket (collection, expr) {
  let boundaries = expr.boundaries
  let defaultKey = expr['default']
  let lower = boundaries[0] // inclusive
  let upper = boundaries[boundaries.length - 1] // exclusive
  let outputExpr = expr.output || { 'count': { '$sum': 1 } }

  assert(boundaries.length > 2, "$bucket 'boundaries' expression must have at least 3 elements")
  let boundType = getType(lower)

  for (let i = 0, len = boundaries.length - 1; i < len; i++) {
    assert(boundType === getType(boundaries[i + 1]), "$bucket 'boundaries' must all be of the same type")
    assert(boundaries[i] < boundaries[i + 1], "$bucket 'boundaries' must be sorted in ascending order")
  }

  !isNil(defaultKey)
  && (getType(expr.default) === getType(lower))
  && assert(lower > expr.default || upper < expr.default, "$bucket 'default' expression must be out of boundaries range")

  let grouped = {}
  each(boundaries, (k) => grouped[k] = [])

  // add default key if provided
  if (!isNil(defaultKey)) grouped[defaultKey] = []

  let iter = false

  return Lazy(() => {
    if (!iter) {
      collection.each(obj => {
        let key = computeValue(obj, expr.groupBy)

        if (isNil(key) || key < lower || key >= upper) {
          assert(!isNil(defaultKey), '$bucket require a default for out of range values')
          grouped[defaultKey].push(obj)
        } else {
          assert(key >= lower && key < upper, "$bucket 'groupBy' expression must resolve to a value in range of boundaries")
          let index = findInsertIndex(boundaries, key)
          let boundKey = boundaries[Math.max(0, index - 1)]
          grouped[boundKey].push(obj)
        }
      })

      // upper bound is exclusive so we remove it
      boundaries.pop()
      if (!isNil(defaultKey)) boundaries.push(defaultKey)

      iter = Lazy(boundaries).map(key => {
        let acc = accumulate(grouped[key], null, outputExpr)
        return Object.assign(acc, { '_id': key })
      })
    }
    return iter.next()
  })
}