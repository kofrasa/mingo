import {
  array,
  assert,
  clone,
  each,
  err,
  findInsertIndex,
  getHash,
  getType,
  groupBy,
  has,
  hasMeta,
  inArray,
  into,
  isArray,
  isBoolean,
  isDate,
  isEmpty,
  isEqual,
  isFunction,
  isNil,
  isNull,
  isNumber,
  isObject,
  isObjectLike,
  isRegExp,
  isString,
  isUndefined,
  keys,
  map,
  memoize,
  notInArray,
  sortBy
} from '../util'
import {
  computeValue,
  getValue,
  idKey,
  redactObj,
  resolve,
  resolveObj,
  removeValue,
  setValue,
  traverse
} from '../internal.js'
import { aggregate } from '../aggregator.js'
import { Query } from '../query.js'
import { ops, OP_GROUP, OP_PROJECTION } from './index.js'
import { groupOperators } from './group.js'
import { projectionOperators } from './projection.js'

/**
 * Pipeline Aggregation Stages. https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/
 */
export const pipelineOperators = {

  /**
   * Adds new fields to documents.
   * Outputs documents that contain all existing fields from the input documents and newly added fields.
   *
   * @param {Array} collection
   * @param {*} expr
   */
  $addFields (collection, expr) {
    let newFields = keys(expr)

    return collection.map((obj) => {
      obj = clone(obj)

      each(newFields, (selector) => {
        let subExpr = expr[selector]
        let newValue

        if (isObject(subExpr)) {
          let subKeys = keys(subExpr)

          // check for any operators first
          let operator = subKeys.filter((k) => {
            return k.indexOf('$') === 0
          })

          if (!isEmpty(operator)) {
            assert(subKeys.length === 1, 'Can have only one root operator in $addFields')
            operator = operator[0]
            subExpr = subExpr[operator]
            newValue = computeValue(obj, subExpr, operator)
          }
        } else {
          newValue = computeValue(obj, subExpr, null)
        }

        traverse(obj, selector, (o, key) => {
          o[key] = newValue
        }, true)
      })

      return obj
    })
  },

  /**
   * Groups documents together for the purpose of calculating aggregate values based on a collection of documents.
   *
   * @param collection
   * @param expr
   * @returns {Array}
   */
    $group (collection, expr) {
    // lookup key for grouping
    let objectId = expr[idKey()]

    let partitions = groupBy(collection, (obj) => {
      return computeValue(obj, objectId, objectId)
    })

    let result = []

    // remove the group key
    delete expr[idKey()]

    each(partitions.keys, (value, i) => {
      let obj = {}

      // exclude undefined key value
      if (!isUndefined(value)) {
        obj[idKey()] = value
      }

      // compute remaining keys in expression
      each(expr, (val, key) => {
        obj[key] = accumulate(partitions.groups[i], key, val)
      })
      result.push(obj)
    })

    return result
  },

  /**
   * Performs a left outer join to another collection in the same database to filter in documents from the “joined” collection for processing.
   *
   * @param collection
   * @param expr
   */
    $lookup (collection, expr) {
    let joinColl = expr.from
    let localField = expr.localField
    let foreignField = expr.foreignField
    let asField = expr.as

    let errorMsg = "Invalid $lookup expression. "
    assert(isArray(joinColl), errorMsg + "'from' must be an array")
    assert(isString(foreignField), errorMsg + "'foreignField' must be a string")
    assert(isString(localField), errorMsg + "'localField' must be a string")
    assert(isString(asField), errorMsg + "'as' must be a string")

    let result = []
    let hash = {}

    function hashCode (v) {
      return getHash(isNil(v) ? null : v)
    }

    if (joinColl.length <= collection.length) {
      each(joinColl, (obj, i) => {
        let k = hashCode(obj[foreignField])
        hash[k] = hash[k] || []
        hash[k].push(i)
      })

      each(collection, (obj) => {
        let k = hashCode(obj[localField])
        let indexes = hash[k] || []
        let newObj = clone(obj)
        newObj[asField] = indexes.map((i) => clone(joinColl[i]))
        result.push(newObj)
      })

    } else {

      each(collection, (obj, i) => {
        let k = hashCode(obj[localField])
        hash[k] = hash[k] || []
        hash[k].push(i)
      })

      let tempResult = {}
      each(joinColl, (obj) => {
        let k = hashCode(obj[foreignField])
        let indexes = hash[k] || []
        each(indexes, (i) => {
          let newObj = tempResult[i] || clone(collection[i])
          newObj[asField] = newObj[asField] || []
          newObj[asField].push(clone(obj))
          tempResult[i] = newObj
        })
      })
      for (let i = 0, len = keys(tempResult).length; i < len; i++) {
        result.push(tempResult[i])
      }
    }

    return result
  },

  /**
   * Filters the document stream, and only allows matching documents to pass into the next pipeline stage.
   * $match uses standard MongoDB queries.
   *
   * @param collection
   * @param expr
   * @returns {Array|*}
   */
    $match (collection, expr) {
    return (new Query(expr)).find(collection).all()
  },

  /**
   * Reshapes a document stream.
   * $project can rename, add, or remove fields as well as create computed values and sub-documents.
   *
   * @param collection
   * @param expr
   * @returns {Array}
   */
    $project (collection, expr) {
    if (isEmpty(expr)) {
      return collection
    }

    // result collection
    let projected = []
    let objKeys = keys(expr)
    let idOnlyExcludedExpression = false
    const ID_KEY = idKey()

    // validate inclusion and exclusion
    let check = [false, false]
    each(expr, (v, k) => {
      if (k === ID_KEY) return
      if (v === 0 || v === false) {
        check[0] = true
      } else {
        check[1] = true
      }
      assert(check[0] !== check[1], 'Projection cannot have a mix of inclusion and exclusion.')
    })

    if (inArray(objKeys, ID_KEY)) {
      let id = expr[ID_KEY]
      if (id === 0 || id === false) {
        objKeys = objKeys.filter(notInArray.bind(null, [ID_KEY]))
        assert(notInArray(objKeys, ID_KEY), 'Must not contain collections id key')
        idOnlyExcludedExpression = isEmpty(objKeys)
      }
    } else {
      // if not specified the add the ID field
      objKeys.push(ID_KEY)
    }

    each(collection, (obj) => {
      let cloneObj = {}
      let foundSlice = false
      let foundExclusion = false
      let dropKeys = []

      if (idOnlyExcludedExpression) {
        dropKeys.push(ID_KEY)
      }

      each(objKeys, (key) => {
        let subExpr = expr[key]
        let value // final computed value of the key

        if (key !== ID_KEY && subExpr === 0) {
          foundExclusion = true
        }

        if (key === ID_KEY && isEmpty(subExpr)) {
          // tiny optimization here to skip over id
          value = obj[key]
        } else if (isString(subExpr)) {
          value = computeValue(obj, subExpr, key)
        } else if (subExpr === 1 || subExpr === true) {
          // For direct projections, we use the resolved object value
        } else if (isObject(subExpr)) {
          let operator = keys(subExpr)
          operator = operator.length > 1 ? false : operator[0]

          if (inArray(ops(OP_PROJECTION), operator)) {
            // apply the projection operator on the operator expression for the key
            if (operator === '$slice') {
              // $slice is handled differently for aggregation and projection operations
              if (array(subExpr[operator]).every(isNumber)) {
                // $slice for projection operation
                value = projectionOperators[operator](obj, subExpr[operator], key)
                foundSlice = true
              } else {
                // $slice for aggregation operation
                value = computeValue(obj, subExpr, key)
              }
            } else {
              value = projectionOperators[operator](obj, subExpr[operator], key)
            }
          } else {
            // compute the value for the sub expression for the key
            value = computeValue(obj, subExpr, key)
          }
        } else {
          dropKeys.push(key)
          return
        }

        // clone resolved values
        let objValue = clone(resolveObj(obj, key))

        if (!isUndefined(objValue)) {
          Object.assign(cloneObj, objValue)
        }
        if (!isUndefined(value)) {
          setValue(cloneObj, key, clone(value))
        }

      })
      // if projection included $slice operator
      // Also if exclusion fields are found or we want to exclude only the id field
      // include keys that were not explicitly excluded
      if (foundSlice || foundExclusion || idOnlyExcludedExpression) {
        cloneObj = Object.assign(clone(obj), cloneObj)
        each(dropKeys, (key) => removeValue(cloneObj, key))
      }
      projected.push(cloneObj)
    })

    return projected
  },

  /**
   * Restricts the number of documents in an aggregation pipeline.
   *
   * @param collection
   * @param value
   * @returns {Object|*}
   */
    $limit (collection, value) {
    return collection.slice(0, value)
  },

  /**
   * Skips over a specified number of documents from the pipeline and returns the rest.
   *
   * @param collection
   * @param value
   * @returns {*}
   */
    $skip (collection, value) {
    return collection.slice(value)
  },

  /**
   * Takes an array of documents and returns them as a stream of documents.
   *
   * @param collection
   * @param expr
   * @returns {Array}
   */
    $unwind (collection, expr) {
    let result = []
    let field = expr.substr(1)
    each(collection, (obj) => {
      // must throw an error if value is not an array
      let value = getValue(obj, field)

      assert(isArray(value), "Target field '" + field + "' is not of type Array.")

      each(value, (item) => {
        let tmp = clone(obj)
        tmp[field] = item
        result.push(tmp)
      })
    })
    return result
  },

  /**
   * Takes all input documents and returns them in a stream of sorted documents.
   *
   * @param collection
   * @param sortKeys
   * @returns {*}
   */
    $sort (collection, sortKeys) {
    if (!isEmpty(sortKeys) && isObject(sortKeys)) {
      let modifiers = keys(sortKeys)
      each(modifiers.reverse(), (key) => {
        let grouped = groupBy(collection, (obj) => resolve(obj, key))
        let sortedIndex = {}
        let getIndex = (k) => sortedIndex[getHash(k)]

        let indexKeys = sortBy(grouped.keys, (item, i) => {
          sortedIndex[getHash(item)] = i
          return item
        })

        if (sortKeys[key] === -1) {
          indexKeys.reverse()
        }
        collection = []
        each(indexKeys, (item) => into(collection, grouped.groups[getIndex(item)]))
      })
    }
    return collection
  },

  /**
   * Groups incoming documents based on the value of a specified expression,
   * then computes the count of documents in each distinct group.
   *
   * https://docs.mongodb.com/manual/reference/operator/aggregation/sortByCount/
   *
   * @param  {Array} collection
   * @param  {Object} expr
   * @return {*}
   */
    $sortByCount (collection, expr) {
    let newExpr = { count: { $sum: 1 } }
    newExpr[idKey()] = expr

    return this.$sort(
      this.$group(collection, newExpr),
      { count: -1 }
    )
  },

  /**
   * Randomly selects the specified number of documents from its input.
   * https://docs.mongodb.com/manual/reference/operator/aggregation/sample/
   *
   * @param  {Array} collection
   * @param  {Object} expr
   * @return {*}
   */
    $sample (collection, expr) {
    let size = expr['size']
    assert(isNumber(size), '$sample size must be a positive integer')

    let result = []
    let len = collection.length
    for (let i = 0; i < size; i++) {
      let n = Math.floor(Math.random() * len)
      result.push(collection[n])
    }
    return result
  },

  /**
   * Returns a document that contains a count of the number of documents input to the stage.
   * @param  {Array} collection
   * @param  {String} expr
   * @return {Object}
   */
    $count (collection, expr) {
    assert(
      isString(expr) && expr.trim() !== '' && expr.indexOf('.') === -1 && expr.trim()[0] !== '$',
      'Invalid expression value for $count'
    )

    let result = {}
    result[expr] = collection.length
    return result
  },

  /**
   * Replaces a document with the specified embedded document or new one.
   * The replacement document can be any valid expression that resolves to a document.
   *
   * https://docs.mongodb.com/manual/reference/operator/aggregation/replaceRoot/
   *
   * @param  {Array} collection
   * @param  {Object} expr
   * @return {*}
   */
    $replaceRoot (collection, expr) {
    let newRoot = expr['newRoot']
    let result = []
    each(collection, (obj) => {
      obj = computeValue(obj, newRoot, null)
      assert(isObject(obj), '$replaceRoot expression must return a valid JS object')
      result.push(obj)
    })
    return result
  },

  /**
   * Restricts the contents of the documents based on information stored in the documents themselves.
   *
   * https://docs.mongodb.com/manual/reference/operator/aggregation/redact/
   */
    $redact (collection, expr) {
    return collection.map((obj) => {
      return redactObj(clone(obj), expr)
    })
  },

  /**
   * Categorizes incoming documents into groups, called buckets, based on a specified expression and bucket boundaries.
   *
   * https://docs.mongodb.com/manual/reference/operator/aggregation/bucket/
   */
    $bucket (collection, expr) {
    let boundaries = expr.boundaries
    let defaultKey = expr.default
    let lower = boundaries[0] // inclusive
    let upper = boundaries[boundaries.length - 1] // exclusive
    let outputExpr = expr.output || { 'count': { '$sum': 1 } }

    assert(boundaries.length > 2, "$bucket 'boundaries' expression must have at least 3 elements")
    let boundType = getType(lower)

    for (let i = 0, len = boundaries.length - 1; i < len; i++) {
      assert(boundType === getType(boundaries[i + 1]), "$bucket 'boundaries' must all be of the same type")
      assert(boundaries[i] < boundaries[i + 1], "$bucket 'boundaries' must be sorted in ascending order")
    }

    if (!isNil(defaultKey) && getType(expr.default) === getType(lower)) {
      assert(lower > expr.default || upper < expr.default, "$bucket 'default' expression must be out of boundaries range")
    }

    let grouped = {}
    each(boundaries, (k) => grouped[k] = [])

    // add default key if provided
    if (!isNil(defaultKey)) grouped[defaultKey] = []

    each(collection, (obj) => {
      let key = computeValue(obj, expr.groupBy, null)

      if (isNil(key) || key < lower || key >= upper) {
        assert(!isNil(defaultKey), '$bucket require a default for out of range values')
        grouped[defaultKey].push(obj)
      } else if (key >= lower && key < upper) {
        let index = findInsertIndex(boundaries, key)
        let boundKey = boundaries[Math.max(0, index - 1)]
        grouped[boundKey].push(obj)
      } else {
        err("$bucket 'groupBy' expression must resolve to a value in range of boundaries")
      }
    })

    // upper bound is exclusive so we remove it
    boundaries.pop()
    if (!isNil(defaultKey)) boundaries.push(defaultKey)

    return map(boundaries, (key) => {
      let acc = accumulate(grouped[key], null, outputExpr)
      return Object.assign(acc, { '_id': key })
    })
  },

  $bucketAuto (collection, expr) {
    let outputExpr = expr.output || { 'count': { '$sum': 1 } }
    let groupByExpr = expr.groupBy
    let granularity = expr.granularity
    let bucketCount = expr.buckets

    assert(bucketCount > 0, "The $bucketAuto 'buckets' field must be greater than 0, but found: " + bucketCount)

    let approxBucketSize = Math.round(collection.length / bucketCount)
    if (approxBucketSize < 1) {
      approxBucketSize = 1
    }

    let computeValueOptimized = memoize(computeValue)
    let grouped = {}
    let remaining = []
    let sorted = sortBy(collection, (o) => {
      let key = computeValueOptimized(o, groupByExpr, null)
      if (isNil(key)) {
        remaining.push(o)
      } else {
        grouped[key] || (grouped[key] = [])
        grouped[key].push(o)
      }
      return key
    })

    let result = []
    let index = 0 // counter for sorted collection

    for (let i = 0, len = sorted.length; i < bucketCount && index < len; i++) {
      let boundaries = {}
      let bucketItems = []

      for (let j = 0; j < approxBucketSize && index < len; j++) {
        let key = computeValueOptimized(sorted[index], groupByExpr, null)

        if (isNil(key)) key = null

        // populate current bucket with all values for current key
        into(bucketItems, isNil(key) ? remaining : grouped[key])

        // increase sort index by number of items added
        index += (isNil(key) ? remaining.length : grouped[key].length)

        // set the min key boundary if not already present
        if (!has(boundaries, 'min')) boundaries['min'] = key

        if (result.length > 0) {
          let lastBucket = result[result.length - 1]
          lastBucket['_id']['max'] = boundaries['min']
        }
      }

      // if is last bucket add remaining items
      if (i == bucketCount - 1) {
        into(bucketItems, sorted.slice(index))
      }

      result.push(Object.assign(accumulate(bucketItems, null, outputExpr), { '_id': boundaries }))
    }

    if (result.length > 0) {
      result[result.length - 1]['_id']['max'] = computeValueOptimized(sorted[sorted.length - 1], groupByExpr, null)
    }

    return result
  },

  /**
   * Processes multiple aggregation pipelines within a single stage on the same set of input documents.
   * Enables the creation of multi-faceted aggregations capable of characterizing data across multiple dimensions, or facets, in a single stage.
   */
  $facet (collection, expr) {
    return map(expr, (pipeline) => aggregate(collection, pipeline))
  }
}

/**
 * Returns the result of evaluating a $group operation over a collection
 *
 * @param collection
 * @param field the name of the aggregate operator or field
 * @param expr the expression of the aggregate operator for the field
 * @returns {*}
 */
function accumulate (collection, field, expr) {
  if (inArray(ops(OP_GROUP), field)) {
    return groupOperators[field](collection, expr)
  }

  if (isObject(expr)) {
    let result = {}
    each(expr, (val, key, _, halt) => {
      result[key] = accumulate(collection, key, expr[key])
      // must run ONLY one group operator per expression
      // if so, return result of the computed value
      if (inArray(ops(OP_GROUP), key)) {
        result = result[key]
        // if there are more keys in expression this is bad
        assert(keys(expr).length === 1, "Invalid $group expression '" + JSON.stringify(expr) + "'")
        halt() // break
      }
    })
    return result
  }

  return undefined
}

