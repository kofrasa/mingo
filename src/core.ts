import {
  assert,
  has,
  each,
  isArray,
  isNil,
  isObject,
  isObjectLike,
  isString,
  keys,
  resolve
} from './util'


export enum OperatorType {
  ACCUMULATOR = 'accumulator',
  EXPRESSION = 'expression',
  PIPELINE = 'pipeline',
  PROJECTION = 'projection',
  QUERY = 'query'
}

// operator definitions
const OPERATORS = {}

each(OperatorType, (cls: OperatorType) => {
  OPERATORS[cls] = {}
})

/**
 * Register fully specified operators for the given operator class.
 *
 * @param cls Category of the operator
 * @param operators Name of operator
 */
export function useOperators(cls: OperatorType, operators: object): void {
  Object.assign(OPERATORS[cls], operators)
}

/**
 * Returns the operator function or null if it is not found
 * @param cls Category of the operator
 * @param operator Name of the operator
 */
export function getOperator(cls: OperatorType, operator: string): Function {
  return has(OPERATORS[cls], operator) ? OPERATORS[cls][operator] : null
}

/**
 * Add new operators
 *
 * @param cls the operator class to extend
 * @param operatorFn a callback that accepts internal object state and returns an object of new operators.
 */
export function addOperators(cls: OperatorType, operatorFn: Function) {

  const newOperators = operatorFn({ accumulate, computeValue, idKey, resolve })

  // check for existing operators
  each(newOperators, (_, op) => {
    assert(/^\$[a-zA-Z0-9_]*$/.test(op), `Invalid operator name ${op}`)
    let call = getOperator(cls, op)
    assert(!call, `${op} already exists for '${cls}' operators`)
  })

  let wrapped = {}

  switch (cls) {
    case OperatorType.QUERY:
      each(newOperators, (fn, op) => {
        fn = fn.bind(newOperators)
        wrapped[op] = (selector: string, value: any) => (obj: object): boolean => {
          // value of field must be fully resolved.
          let lhs = resolve(obj, selector, { unwrapArray: true })
          return fn(selector, lhs, value)
        }
      })
      break
    case OperatorType.PROJECTION:
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
  useOperators(cls, wrapped)
}

/**
 * Global internal config for the library
 */
interface Config {
  key: string
}

// Settings used by Mingo internally
const settings: Config = {
  key: '_id'
}

/**
 * Setup default settings for Mingo
 * @param options
 */
export function setup(options: Config) {
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
  '$$KEEP'(obj: object, expr: object, options?: ComputeOptions): any {
    return obj
  },
  '$$PRUNE'(obj: object, expr: object, options?: ComputeOptions): any {
    return undefined
  },
  '$$DESCEND'(obj: object, expr: object, options?: ComputeOptions): any {
    // traverse nested documents iff there is a $cond
    if (!has(expr, '$cond')) return obj

    let result: any

    each(obj, (current, key) => {
      if (isObjectLike(current)) {
        if (isArray(current)) {
          result = []
          each(current, (elem) => {
            if (isObject(elem)) {
              elem = redact(elem, expr, options)
            }
            if (!isNil(elem)) result.push(elem)
          })
        } else {
          result = redact(current, expr, options)
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
  let call = getOperator(OperatorType.ACCUMULATOR, field)
  if (call) return call(collection, expr)

  if (isObject(expr)) {
    let result = {}
    each(expr, (val, key) => {
      result[key] = accumulate(collection, key, expr[key])
      // must run ONLY one group operator per expression
      // if so, return result of the computed value
      if (getOperator(OperatorType.ACCUMULATOR, key)) {
        result = result[key]
        // if there are more keys in expression this is bad
        assert(keys(expr).length === 1, "Invalid $group expression '" + JSON.stringify(expr) + "'")
        return false // break
      }
    })
    return result
  }
}

interface ComputeOptions {
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
export function computeValue(obj: object, expr: any, operator?: string, options?: ComputeOptions): any {
  if (options === undefined) {
    options = { root: obj }
  }

  // if the field of the object is a valid operator
  let call = getOperator(OperatorType.EXPRESSION, operator)
  if (call) return call(obj, expr, options)

  // we also handle $group accumulator operators
  call = getOperator(OperatorType.ACCUMULATOR, operator)
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
  if (isArray(expr)) {
    return expr.map(item => computeValue(obj, item))
  } else if (isObject(expr)) {
    let result = {}
    each(expr, (val, key) => {
      result[key] = computeValue(obj, val, key, options)
      // must run ONLY one aggregate operator per expression
      // if so, return result of the computed value
      if ([OperatorType.EXPRESSION, OperatorType.ACCUMULATOR].some(c => has(OPERATORS[c], key))) {
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
export function redact(obj: object, expr: any, options?: ComputeOptions): object {
  let result = computeValue(obj, expr, null, options)
  return has(redactVariables, result)
    ? redactVariables[result](obj, expr, options)
    : result
}