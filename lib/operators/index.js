import { OP_PROJECTION, OP_QUERY, OP_EXPRESSION, OP_GROUP, OP_PIPELINE } from '../constants'
import * as expressionOperators from './expression'
import * as groupOperators from './group'
import * as pipelineOperators from './pipeline'
import * as projectionOperators from './projection'
import * as queryOperators from './query'
import { assert, each, has, isBoolean, resolve } from '../util'
import { _internal } from '../internal'


// operator definitions
export const OPERATORS = {}

OPERATORS[OP_EXPRESSION] = {}
OPERATORS[OP_GROUP] = {}
OPERATORS[OP_PIPELINE] = {}
OPERATORS[OP_PROJECTION] = {}
OPERATORS[OP_QUERY] = {}

const SYSTEM_OPERATORS = [
  [OP_EXPRESSION, expressionOperators],
  [OP_GROUP, groupOperators],
  [OP_PIPELINE, pipelineOperators],
  [OP_PROJECTION, projectionOperators],
  [OP_QUERY, queryOperators]
]

/**
 * Enables the default operators of the system
 */
export function enableSystemOperators() {
  each(SYSTEM_OPERATORS, arr => {
    let [cls, values] = arr
    Object.assign(OPERATORS[cls], values)
  })
}

export function useSystemOperators(opClass, operators) {
  let exitingOperators = OPERATORS[opClass]
  each(operators, (_, op) => {
    assert(!has(exitingOperators, op), `${op} already exists for '${opClass}' operators`)
  })
  Object.assign(OPERATORS[opClass], operators)
}

/**
 * Add new operators
 *
 * @param opClass the operator class to extend
 * @param fn a function returning an object of new operators
 */
export function addOperators (opClass, fn) {

  const newOperators = fn(_internal())

  // ensure correct type specified
  assert(has(OPERATORS, opClass), `Invalid operator class ${opClass}`)

  let operators = OPERATORS[opClass]

  // check for existing operators
  each(newOperators, (_, op) => {
    assert(/^\$[a-zA-Z0-9_]*$/.test(op), `Invalid operator name ${op}`)
    assert(!has(operators, op), `${op} already exists for '${opClass}' operators`)
  })

  let wrapped = {}

  switch (opClass) {
    case OP_QUERY:
      each(newOperators, (fn, op) => {
        fn = fn.bind(newOperators)
        wrapped[op] = (selector, value) => obj => {
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
        wrapped[op] = (obj, expr, selector) => {
          let lhs = resolve(obj, selector)
          return fn(selector, lhs, expr)
        }
      })
      break
    default:
      each(newOperators, (fn, op) => {
        wrapped[op] = (...args) => fn.apply(newOperators, args)
      })
  }

  // toss the operator salad :)
  Object.assign(OPERATORS[opClass], wrapped)
}
