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
  resolve,
  Callback,
  isOperator,
  into
} from './util'

/**
 * Config information to use when executing operators
 */
export interface Config {
  idKey: string
}

/**
 * Creates a new default config
 */
export function createConfig(): Config {
  return { idKey: '_id' }
}

/**
 * Generic options interface passed down to all operators
 */
export interface Options {
  config: Config
  collation?: CollationSpec
}

export interface CollationSpec {
  locale: string,
  caseLevel?: boolean,
  caseFirst?: string,
  strength?: number,
  numericOrdering?: boolean,
  alternate?: string,
  maxVariable?: string, // unsupported
  backwards?: boolean // unsupported
}

/**
 * The different groups of operators
 */
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

interface Operators {
  [key: string]: Function
}

/**
 * Validates the object collection of operators
 */
function validateOperators(operators: Operators): void {
  each(operators, (v: Function, k: string) => {
    assert(v instanceof Function && isOperator(k), "invalid operator specified")
  })
}

/**
 * Register fully specified operators for the given operator class.
 *
 * @param cls Category of the operator
 * @param operators Name of operator
 */
export function useOperators(cls: OperatorType, operators: Operators): void {
  validateOperators(operators)
  into(OPERATORS[cls], operators)
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
export function addOperators(cls: OperatorType, operatorFn: Callback<Operators>) {

  const newOperators = operatorFn({ computeValue, resolve })

  validateOperators(newOperators)

  // check for existing operators
  each(newOperators, (_, op) => {
    let call = getOperator(cls, op)
    assert(!call, `${op} already exists for '${cls}' operators`)
  })

  let wrapped = {}

  switch (cls) {
    case OperatorType.QUERY:
      each(newOperators, (fn, op) => {
        fn = fn.bind(newOperators)
        wrapped[op] = (selector: string, value: any, options: Options) => (obj: object): boolean => {
          // value of field must be fully resolved.
          let lhs = resolve(obj, selector, { unwrapArray: true })
          return fn(selector, lhs, value, options)
        }
      })
      break
    case OperatorType.PROJECTION:
      each(newOperators, (fn, op) => {
        fn = fn.bind(newOperators)
        wrapped[op] = (obj: object, expr: any, selector: string, options: Options) => {
          let lhs = resolve(obj, selector)
          return fn(selector, lhs, expr, options)
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
 * Implementation of system variables
 * @type {Object}
 */
const systemVariables: object = {
  '$$ROOT'(obj: object, expr: any, options: ComputeOptions) {
    return options.root
  },
  '$$CURRENT'(obj: object, expr: any, options: ComputeOptions) {
    return obj
  },
  '$$REMOVE'(obj: object, expr: any, options: ComputeOptions) {
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
const redactVariables: object = {
  '$$KEEP'(obj: object, expr: any, options?: ComputeOptions): any {
    return obj
  },
  '$$PRUNE' (obj: object, expr: any, options?: ComputeOptions): any {
    return undefined
  },
  '$$DESCEND'(obj: object, expr: any, options?: ComputeOptions): any {
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

// options to core functions computeValue() and redact()
interface ComputeOptions extends Options {
  root?: object
}

/**
 * Computes the value of the expression on the object for the given operator
 *
 * @param obj the current object from the collection
 * @param expr the expression for the given field
 * @param operator the operator to resolve the field with
 * @param options {Object} extra options
 * @returns {*}
 */
export function computeValue(obj: object | any[], expr: any, operator: string, options?: ComputeOptions): any {
  // ensure valid options exist on first invocation
  options = options || { config: null }
  options.config = options.config || createConfig()

  if (isOperator(operator)) {
    // if the field of the object is a valid operator
    let call = getOperator(OperatorType.EXPRESSION, operator)
    if (call) return call(obj, expr, options)

    // we also handle $group accumulator operators
    call = getOperator(OperatorType.ACCUMULATOR, operator)
    if (call) {

      // if object is not an array, first try to compute using the expression
      if (!isArray(obj)) {
        obj = computeValue(obj, expr, null, options)
        expr = null
      }

      // validate that we have an array
      assert(isArray(obj), `'${operator}' target must be an array.`)

      // we pass a null expression because all values have been resolved
      return call(obj, expr, options)
    }

    // operator was not found
    throw new Error(`operator '${operator}' is not registered`)
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
      // set 'root' only the first time it is required to be used for all subsequent calls
      // if it already available on the options, it will be used
      obj = systemVariables[arr[0]](obj, null, into({ root: obj }, options))
      if (arr.length == 1) return obj
      expr = expr.substr(arr[0].length) // '.' prefix will be sliced off below
    }

    return resolve(obj, expr.slice(1))
  }

  // check and return value if already in a resolved state
  if (isArray(expr)) {
    return expr.map((item: any) => computeValue(obj, item, null, options))
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
 * @param  {*} options  Options for value
 * @return {*} returns the result of the redacted object
 */
export function redact(obj: object, expr: any, options: ComputeOptions): object {
  let result = computeValue(obj, expr, null, options)
  return has(redactVariables, result)
    ? redactVariables[result](obj, expr, into({root: obj}, options))
    : result
}
