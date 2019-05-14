import { OP_PROJECTION, OP_QUERY, OP_EXPRESSION, OP_GROUP, OP_PIPELINE } from '../constants'
import { expressionOperators } from './expression/index'
import { groupOperators } from './group/index'
import { pipelineOperators } from './pipeline/index'
import { projectionOperators } from './projection'
import { queryOperators } from './query'
import { assert, each, has, isBoolean, resolve } from '../util'
import { _internal } from '../internal'


// operator definitions
export const OPERATORS = {}
OPERATORS[OP_EXPRESSION] = expressionOperators
OPERATORS[OP_GROUP] = groupOperators
OPERATORS[OP_PIPELINE] = pipelineOperators
OPERATORS[OP_PROJECTION] = projectionOperators
OPERATORS[OP_QUERY] = queryOperators

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
    assert(/^\$\w+$/.test(op), `Invalid operator name ${op}`)
    assert(!has(operators, op), `${op} already exists for '${opClass}' operators`)
  })

  let wrapped = {}

  switch (opClass) {
    case OP_QUERY:
      each(newOperators, (fn, op) => {
        fn = fn.bind(newOperators)
        wrapped[op] = (selector, value) => ({
          test (obj) {
            // value of field must be fully resolved.
            let lhs = resolve(obj, selector)
            let result = fn(selector, lhs, value)
            assert(isBoolean(result), `${op} must return a boolean`)
            return result
          }
        })
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
