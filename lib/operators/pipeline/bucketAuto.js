import {
  assert,
  each,
  findInsertIndex,
  getType,
  has,
  into,
  isNil,
  keys,
  memoize,
  sortBy
} from '../../util'
import { accumulate, computeValue, idKey, traverse } from '../../internal'
import { Lazy } from '../../lazy'


export function $bucketAuto (collection, expr) {
  let outputExpr = expr.output || { 'count': { '$sum': 1 } }
  let groupByExpr = expr.groupBy
  let bucketCount = expr.buckets

  assert(bucketCount > 0, "The $bucketAuto 'buckets' field must be greater than 0, but found: " + bucketCount)

  return collection.transform(coll => {
    let approxBucketSize = Math.max(1, Math.round(coll.length / bucketCount))

      let computeValueOptimized = memoize(computeValue)
      let grouped = {}
      let remaining = []
      let sorted = sortBy(coll, (o) => {
        let key = computeValueOptimized(o, groupByExpr)
        if (isNil(key)) {
          remaining.push(o)
        } else {
          grouped[key] || (grouped[key] = [])
          grouped[key].push(o)
        }
        return key
      })

      const ID_KEY = idKey()
      let result = []
      let index = 0 // counter for sorted collection

      for (let i = 0, len = sorted.length; i < bucketCount && index < len; i++) {
        let boundaries = {}
        let bucketItems = []

        for (let j = 0; j < approxBucketSize && index < len; j++) {
          let key = computeValueOptimized(sorted[index], groupByExpr)

          if (isNil(key)) key = null

          // populate current bucket with all values for current key
          into(bucketItems, isNil(key) ? remaining : grouped[key])

          // increase sort index by number of items added
          index += (isNil(key) ? remaining.length : grouped[key].length)

          // set the min key boundary if not already present
          if (!has(boundaries, 'min')) boundaries.min = key

          if (result.length > 0) {
            let lastBucket = result[result.length - 1]
            lastBucket[ID_KEY].max = boundaries.min
          }
        }

        // if is last bucket add remaining items
        if (i == bucketCount - 1) {
          into(bucketItems, sorted.slice(index))
        }

        result.push(Object.assign(accumulate(bucketItems, null, outputExpr), { '_id': boundaries }))
      }

      if (result.length > 0) {
        result[result.length - 1][ID_KEY].max = computeValueOptimized(sorted[sorted.length - 1], groupByExpr)
      }

      return result

  })
}