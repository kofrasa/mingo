/**
 * Pipeline Aggregation Stages. https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/
 */
var pipelineOperators = {

  /**
   * Adds new fields to documents.
   * Outputs documents that contain all existing fields from the input documents and newly added fields.
   *
   * @param {Array} collection
   * @param {*} expr
   */
  $addFields: function (collection, expr) {
    var newFields = keys(expr)

    return collection.map(function (obj) {
      obj = clone(obj)

      each(newFields, function (selector) {
        var subExpr = expr[selector]
        var newValue

        if (isObject(subExpr)) {
          var subKeys = keys(subExpr)

          // check for any operators first
          var operator = subKeys.filter(function (k) {
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

        traverse(obj, selector, function (o, key) {
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
  $group: function (collection, expr) {
    // lookup key for grouping
    var idKey = expr[keyId()]

    var partitions = groupBy(collection, function (obj) {
      return computeValue(obj, idKey, idKey)
    })

    var result = []

    // remove the group key
    delete expr[keyId()]

    each(partitions.keys, function (value, i) {
      var obj = {}

      // exclude undefined key value
      if (!isUndefined(value)) {
        obj[keyId()] = value
      }

      // compute remaining keys in expression
      for (var key in expr) {
        if (has(expr, key)) {
          obj[key] = accumulate(partitions.groups[i], key, expr[key])
        }
      }
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
  $lookup: function (collection, expr) {
    var joinColl = expr.from
    var localField = expr.localField
    var foreignField = expr.foreignField
    var asField = expr.as

    var errorMsg = "Invalid $lookup expression. "
    assert(isArray(joinColl), errorMsg + "'from' must be an array")
    assert(isString(foreignField), errorMsg + "'foreignField' must be a string")
    assert(isString(localField), errorMsg + "'localField' must be a string")
    assert(isString(asField), errorMsg + "'as' must be a string")

    var result = []
    var hash = {}

    function hashCode (v) {
      return getHash(isNil(v) ? null : v)
    }

    if (joinColl.length <= collection.length) {
      each(joinColl, function (obj, i) {
        var k = hashCode(obj[foreignField])
        hash[k] = hash[k] || []
        hash[k].push(i)
      })

      each(collection, function (obj) {
        var k = hashCode(obj[localField])
        var indexes = hash[k] || []
        var newObj = clone(obj)
        newObj[asField] = map(indexes, function (i) {
          return clone(joinColl[i])
        })
        result.push(newObj)
      })

    } else {

      each(collection, function (obj, i) {
        var k = hashCode(obj[localField])
        hash[k] = hash[k] || []
        hash[k].push(i)
      })

      var tempResult = {}
      each(joinColl, function (obj) {
        var k = hashCode(obj[foreignField])
        var indexes = hash[k] || []
        each(indexes, function (i) {
          var newObj = tempResult[i] || clone(collection[i])
          newObj[asField] = newObj[asField] || []
          newObj[asField].push(clone(obj))
          tempResult[i] = newObj
        })
      })
      for (var i = 0, len = keys(tempResult).length; i < len; i++) {
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
  $match: function (collection, expr) {
    return (new Mingo.Query(expr)).find(collection).all()
  },

  /**
   * Reshapes a document stream.
   * $project can rename, add, or remove fields as well as create computed values and sub-documents.
   *
   * @param collection
   * @param expr
   * @returns {Array}
   */
  $project: function (collection, expr) {
    if (isEmpty(expr)) {
      return collection
    }

    // result collection
    var projected = []
    var objKeys = keys(expr)
    var idOnlyExcludedExpression = false

    // validate inclusion and exclusion
    var check = [false, false]
    each(objKeys, function (k) {
      var v = expr[k]
      if (k === keyId()) return
      if (v === 0 || v === false) {
        check[0] = true
      } else {
        check[1] = true
      }
      assert(check[0] !== check[1], 'Projection cannot have a mix of inclusion and exclusion.')
    })

    if (inArray(objKeys, keyId())) {
      var id = expr[keyId()]
      if (id === 0 || id === false) {
        objKeys = objKeys.filter(notInArray.bind(null, [keyId()]))
        assert(notInArray(objKeys, keyId()), 'Must not contain collections _id')
        idOnlyExcludedExpression = isEmpty(objKeys)
      }
    } else {
      // if not specified the add the ID field
      objKeys.push(keyId())
    }

    each(collection, function (obj, i) {
      var cloneObj = {}
      var foundSlice = false
      var foundExclusion = false
      var dropKeys = []

      if (idOnlyExcludedExpression) {
        dropKeys.push(keyId())
      }

      each(objKeys, function (key) {
        var subExpr = expr[key]
        var value // final computed value of the key
        var objValue // full object graph to value of the key

        if (key !== keyId() && subExpr === 0) {
          foundExclusion = true
        }

        if (key === keyId() && isEmpty(subExpr)) {
          // tiny optimization here to skip over id
          value = obj[key]
        } else if (isString(subExpr)) {
          value = computeValue(obj, subExpr, key)
        } else if (subExpr === 1 || subExpr === true) {
          // For direct projections, we use the resolved object value
        } else if (isObject(subExpr)) {
          var operator = keys(subExpr)
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
        objValue = clone(resolveObj(obj, key))

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
        each(dropKeys, function (key) {
          removeValue(cloneObj, key)
        })
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
  $limit: function (collection, value) {
    return collection.slice(0, value)
  },

  /**
   * Skips over a specified number of documents from the pipeline and returns the rest.
   *
   * @param collection
   * @param value
   * @returns {*}
   */
  $skip: function (collection, value) {
    return collection.slice(value)
  },

  /**
   * Takes an array of documents and returns them as a stream of documents.
   *
   * @param collection
   * @param expr
   * @returns {Array}
   */
  $unwind: function (collection, expr) {
    var result = []
    var field = expr.substr(1)
    for (var i = 0; i < collection.length; i++) {
      var obj = collection[i]
      // must throw an error if value is not an array
      var value = getValue(obj, field)
      if (isArray(value)) {
        each(value, function (item) {
          var tmp = clone(obj)
          tmp[field] = item
          result.push(tmp)
        })
      } else {
        err("Target field '" + field + "' is not of type Array.")
      }
    }
    return result
  },

  /**
   * Takes all input documents and returns them in a stream of sorted documents.
   *
   * @param collection
   * @param sortKeys
   * @returns {*}
   */
  $sort: function (collection, sortKeys) {
    if (!isEmpty(sortKeys) && isObject(sortKeys)) {
      var modifiers = keys(sortKeys)
      each(modifiers.reverse(), function (key) {
        var grouped = groupBy(collection, function (obj) {
          return resolve(obj, key)
        })
        var sortedIndex = {}
        var findIndex = function (k) {
          return sortedIndex[getHash(k)]
        }

        var indexKeys = sortBy(grouped.keys, function (item, i) {
          sortedIndex[getHash(item)] = i
          return item
        })

        if (sortKeys[key] === -1) {
          indexKeys.reverse()
        }
        collection = []
        each(indexKeys, function (item) {
          into(collection, grouped.groups[findIndex(item)])
        })
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
  $sortByCount: function (collection, expr) {
    var newExpr = { count: { $sum: 1 } }
    newExpr[keyId()] = expr

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
  $sample: function (collection, expr) {
    var size = expr['size']
    assert(isNumber(size), '$sample size must be a positive integer')

    var result = []
    for (var i = 0; i < size; i++) {
      var n = Math.floor(Math.random() * collection.length)
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
  $count: function (collection, expr) {
    assert(
      isString(expr) && expr.trim() !== '' && expr.indexOf('.') === -1 && expr.trim()[0] !== '$',
      'Invalid expression value for $count'
    )

    var result = {}
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
  $replaceRoot: function (collection, expr) {
    var newRoot = expr['newRoot']
    var result = []
    each(collection, function (obj) {
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
  $redact: function (collection, expr) {
    return collection.map(function (obj) {
      return redactObj(clone(obj), expr)
    })
  },

  /**
   * Categorizes incoming documents into groups, called buckets, based on a specified expression and bucket boundaries.
   *
   * https://docs.mongodb.com/manual/reference/operator/aggregation/bucket/
   */
  $bucket: function (collection, expr) {
    var boundaries = expr.boundaries
    var defaultKey = expr.default
    var lower = boundaries[0] // inclusive
    var upper = boundaries[boundaries.length - 1] // exclusive
    var outputExpr = expr.output || { 'count': { '$sum': 1 } }

    assert(boundaries.length > 2, "$bucket 'boundaries' expression must have at least 3 elements")
    var boundType = getType(lower)

    for (var i = 0, len = boundaries.length - 1; i < len; i++) {
      assert(boundType === getType(boundaries[i + 1]), "$bucket 'boundaries' must all be of the same type")
      assert(boundaries[i] < boundaries[i + 1], "$bucket 'boundaries' must be sorted in ascending order")
    }

    if (!isNil(defaultKey) && getType(expr.default) === getType(lower)) {
      assert(lower > expr.default || upper < expr.default, "$bucket 'default' expression must be out of boundaries range")
    }

    var grouped = {}
    each(boundaries, function (k) {
      grouped[k] = []
    })
    // add default key if provided
    if (!isNil(defaultKey)) grouped[defaultKey] = []

    each(collection, function (obj) {
      var key = computeValue(obj, expr.groupBy, null)

      if (isNil(key) || key < lower || key >= upper) {
        assert(!isNil(defaultKey), '$bucket require a default for out of range values')
        grouped[defaultKey].push(obj)
      } else if (key >= lower && key < upper) {
        var index = findInsertIndex(boundaries, key)
        var boundKey = boundaries[Math.max(0, index - 1)]
        grouped[boundKey].push(obj)
      } else {
        err("$bucket 'groupBy' expression must resolve to a value in range of boundaries")
      }
    })

    // upper bound is exclusive so we remove it
    boundaries.pop()
    if (!isNil(defaultKey)) boundaries.push(defaultKey)

    return map(boundaries, function (key) {
      var acc = accumulate(grouped[key], null, outputExpr)
      return Object.assign(acc, { '_id': key })
    })
  },

  $bucketAuto: function (collection, expr) {
    var outputExpr = expr.output || { 'count': { '$sum': 1 } }
    var groupByExpr = expr.groupBy
    var granularity = expr.granularity
    var bucketCount = expr.buckets

    assert(bucketCount > 0, "The $bucketAuto 'buckets' field must be greater than 0, but found: " + bucketCount)

    var approxBucketSize = Math.round(collection.length / bucketCount)
    if (approxBucketSize < 1) {
      approxBucketSize = 1
    }

    var computeValueOptimized = memoize(computeValue)
    var grouped = {}
    var remaining = []
    var sorted = sortBy(collection, function (o) {
      var key = computeValueOptimized(o, groupByExpr, null)
      if (isNil(key)) {
        remaining.push(o)
      } else {
        grouped[key] || (grouped[key] = [])
        grouped[key].push(o)
      }
      return key
    })

    var result = []
    var index = 0 // counter for sorted collection
    var len = sorted.length

    for (var i = 0; i < bucketCount && index < len; i++) {
      var boundaries = {}
      var bucketItems = []

      for (var j = 0; j < approxBucketSize && index < len; j++) {
        var key = computeValueOptimized(sorted[index], groupByExpr, null)

        if (isNil(key)) key = null

        // populate current bucket with all values for current key
        into(bucketItems, isNil(key) ? remaining : grouped[key])

        // increase sort index by number of items added
        index += (isNil(key) ? remaining.length : grouped[key].length)

        // set the min key boundary if not already present
        if (!has(boundaries, 'min')) boundaries['min'] = key

        if (result.length > 0) {
          var lastBucket = result[result.length - 1]
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
  $facet: function (collection, expr) {
    return map(expr, function (pipeline) {
      return Mingo.aggregate(collection, pipeline)
    })
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
    var result = {}
    for (var key in expr) {
      if (has(expr, key)) {
        result[key] = accumulate(collection, key, expr[key])
        // must run ONLY one group operator per expression
        // if so, return result of the computed value
        if (inArray(ops(OP_GROUP), key)) {
          result = result[key]
          // if there are more keys in expression this is bad
          if (keys(expr).length > 1) {
            err("Invalid $group expression '" + stringify(expr) + "'")
          }
          break
        }
      }
    }
    return result
  }

  return undefined
}