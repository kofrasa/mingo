
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
    var getHash = function (v) { return hashcode(isNil(v)? null : v) }

    each(joinColl, function (obj, i) {
      var k = getHash(obj[foreignField])
      hash[k] = hash[k] || []
      hash[k].push(i)
    })

    each(collection, function (obj) {
      var k = getHash(obj[localField])
      var indexes = hash[k] || []
      var newObj = clone(obj)
      newObj[asField] = map(indexes, function (i) {
        return clone(joinColl[i])
      })
      result.push(newObj)
    })

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

          if (inArray(ops(KEY_PROJECTION), operator)) {
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
        value = clone(value)
        objValue = clone(resolveObj(obj, key))

        if (!isUndefined(objValue)) {
          Object.assign(cloneObj, objValue)
        }
        if (!isUndefined(value)) {
          setValue(cloneObj, key, value)
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
        except("Target field '" + field + "' is not of type Array.")
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
        var findIndex = function (k) { return sortedIndex[hashcode(k)] }

        var indexKeys = sortBy(grouped.keys, function (item, i) {
          sortedIndex[hashcode(item)] = i
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
    assert(isNumber(size),
    '$sample size must be a positive integer')

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
      assert(isObject(obj),
        '$replaceRoot expression must return a valid JS object')
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
  if (inArray(ops(KEY_GROUP), field)) {
    return groupOperators[field](collection, expr)
  }

  if (isObject(expr)) {
    var result = {}
    for (var key in expr) {
      if (has(expr, key)) {
        result[key] = accumulate(collection, key, expr[key])
        // must run ONLY one group operator per expression
        // if so, return result of the computed value
        if (inArray(ops(KEY_GROUP), key)) {
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