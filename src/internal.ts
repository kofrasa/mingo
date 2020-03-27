import {
  assert,
  each,
  has,
  isArray,
  isNil,
  isObject,
  isObjectLike,
  isString,
  keys,
  resolve,
  moduleApi,
  Callback,
  isBoolean
} from './util'

// operator classes
export const OP_EXPRESSION = 'expression'
export const OP_GROUP = 'group'
export const OP_PIPELINE = 'pipeline'
export const OP_PROJECTION = 'projection'
export const OP_QUERY = 'query'

type OperatorClass = 'expression' | 'group' | 'pipeline' | 'projection' | 'query'

// operator definitions
const OPERATORS = Object.create({})

each([OP_GROUP, OP_EXPRESSION, OP_PIPELINE, OP_PROJECTION, OP_QUERY], (cls: OperatorClass) => {
  OPERATORS[cls] = Object.create({})
})

/**
 * Enables the given operators for the specified category.
 *
 * @param cls Category of the operator
 * @param operators Name of operator
 */
export function enableOperators(cls: OperatorClass, operators: object): void {
  Object.assign(OPERATORS[cls], operators)
}

/**
 * Returns the operator function as a callable or null if it is not found
 * @param cls Category of the operator
 * @param operator Name of the operator
 */
export function getOperator(cls: OperatorClass, operator: string): Callback<any> {
  return has(OPERATORS[cls], operator) ? OPERATORS[cls][operator] : null
}

/**
 * Add new operators
 *
 * @param cls the operator class to extend
 * @param fn a function returning an object of new operators
 */
export function addOperators(cls: OperatorClass, fn: Callback<any>) {

  const newOperators = fn(_internal())

  // check for existing operators
  each(newOperators, (_, op) => {
    assert(/^\$[a-zA-Z0-9_]*$/.test(op), `Invalid operator name ${op}`)
    let call = getOperator(cls, op)
    assert(!call, `${op} already exists for '${cls}' operators`)
  })

  let wrapped = {}

  switch (cls) {
    case OP_QUERY:
      each(newOperators, (fn, op) => {
        fn = fn.bind(newOperators)
        wrapped[op] = (selector: string, value: any) => (obj: object) => {
          // value of field must be fully resolved.
          let lhs = resolve(obj, selector)
          let result = fn(selector, lhs, value)
          assert(isBoolean(result), `${op} must return a boolean`)
          return result
        }
      })
      break
    case OP_PROJECTION:
      each(newOperators, (fn, op) => {
        fn = fn.bind(newOperators)
        wrapped[op] = (obj: object, expr: any, selector: string) => {
          let lhs = resolve(obj, selector)
          return fn(selector, lhs, expr)
        }
      })
      break
    default:
      each(newOperators, (fn, op) => {
        wrapped[op] = (...args: any[]) => fn.apply(newOperators, args)
      })
  }

  // toss the operator salad :)
  enableOperators(cls, wrapped)
}


interface Settings {
  key: string
}

// internal functions available to external operators
export const _internal = () => Object.assign({ computeValue }, moduleApi())

// Settings used by Mingo internally
const settings = {
  key: '_id'
}

/**
 * Setup default settings for Mingo
 * @param options
 */
export function setup(options: Settings) {
  Object.assign(settings, options)
}

/**
 * Implementation of system variables
 * @type {Object}
 */
const systemVariables = {
  '$$ROOT'(obj, expr, opt) {
    return opt.root
  },
  '$$CURRENT'(obj, expr, opt) {
    return obj
  },
  '$$REMOVE'(obj, expr, opt) {
    return undefined
  }
}

/**
 * Implementation of $redact variables
 *
 * Each function accepts 3 arguments (obj, expr, opt)
 *
 * @type {Object}
 */
const redactVariables = {
  '$$KEEP'(obj: object, expr: object, options?: Options): any {
    return obj
  },
  '$$PRUNE'(obj: object, expr: object, options?: Options): any {
    return undefined
  },
  '$$DESCEND'(obj: object, expr: object, options?: Options): any {
    // traverse nested documents iff there is a $cond
    if (!has(expr, '$cond')) return obj

    let result: any

    each(obj, (current, key) => {
      if (isObjectLike(current)) {
        if (isArray(current)) {
          result = []
          each(current, (elem) => {
            if (isObject(elem)) {
              elem = redactObj(elem, expr, options)
            }
            if (!isNil(elem)) result.push(elem)
          })
        } else {
          result = redactObj(current, expr, options)
        }

        if (isNil(result)) {
          delete obj[key] // pruned result
        } else {
          obj[key] = result
        }
      }
    })
    return obj
  }
}

/**
 * Returns the key used as the collection's objects ids
 */
export function idKey(): string {
  return settings.key
}

/**
 * Returns the result of evaluating a $group operation over a collection
 *
 * @param collection
 * @param field the name of the aggregate operator or field
 * @param expr the expression of the aggregate operator for the field
 * @returns {*}
 */
export function accumulate(collection: any[], field: string, expr: any): any {
  let call = getOperator(OP_GROUP, field)
  if (call) return call(collection, expr)

  if (isObject(expr)) {
    let result = {}
    each(expr, (val, key) => {
      result[key] = accumulate(collection, key, expr[key])
      // must run ONLY one group operator per expression
      // if so, return result of the computed value
      if (getOperator(OP_GROUP, key)) {
        result = result[key]
        // if there are more keys in expression this is bad
        assert(keys(expr).length === 1, "Invalid $group expression '" + JSON.stringify(expr) + "'")
        return false // break
      }
    })
    return result
  }
}

interface Options {
  root: object
}

/**
 * Computes the actual value of the expression using the given object as context
 *
 * @param obj the current object from the collection
 * @param expr the expression for the given field
 * @param operator the operator to resolve the field with
 * @param options {Object} extra options
 * @returns {*}
 */
export function computeValue(obj: object, expr: any, operator?: string, options?: Options): any {
  if (options === undefined) {
    options = { root: obj }
  }

  // if the field of the object is a valid operator
  let call = getOperator(OP_EXPRESSION, operator)
  if (call) return call(obj, expr, options)

  // we also handle $group accumulator operators
  call = getOperator(OP_GROUP, operator)
  if (call) {
    // we first fully resolve the expression
    obj = computeValue(obj, expr, null, options)
    assert(isArray(obj), operator + ' expression must resolve to an array')
    // we pass a null expression because all values have been resolved
    return call(obj, null, options)
  }

  // if expr is a variable for an object field
  // field not used in this case
  if (isString(expr) && expr.length > 0 && expr[0] === '$') {
    // we return redact variables as literals
    if (has(redactVariables, expr)) {
      return expr
    }

    // handle selectors with explicit prefix
    let arr = expr.split('.')
    if (has(systemVariables, arr[0])) {
      obj = systemVariables[arr[0]](obj, null, options)
      if (arr.length == 1) return obj
      expr = expr.substr(arr[0].length) // '.' prefix will be sliced off below
    }

    return resolve(obj, expr.slice(1))
  }

  // check and return value if already in a resolved state
  if (Array.isArray(expr)) {
    return expr.map(item => computeValue(obj, item))
  } else if (isObject(expr)) {
    let result = Object.create({})
    each(expr, (val, key) => {
      result[key] = computeValue(obj, val, key, options)
      // must run ONLY one aggregate operator per expression
      // if so, return result of the computed value
      if ([OP_EXPRESSION, OP_GROUP].some(c => has(OPERATORS[c], key))) {
        // there should be only one operator
        assert(keys(expr).length === 1, "Invalid aggregation expression '" + JSON.stringify(expr) + "'")
        result = result[key]
        return false // break
      }
    })
    return result
  } else {
    return expr
  }
}

/**
 * Redact an object
 * @param  {Object} obj The object to redact
 * @param  {*} expr The redact expression
 * @param  {*} opt  Options for value
 * @return {*} Returns the redacted value
 */
export function redactObj(obj: object, expr: any, options?: Options): object {
  let result = computeValue(obj, expr, null, options)
  return has(redactVariables, result)
    ? redactVariables[result](obj, expr, options)
    : result
}