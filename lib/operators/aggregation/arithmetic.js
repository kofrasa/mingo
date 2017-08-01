import { assert, err, isNil, isNumber, isArray, reduce } from '../../util.js'
import { computeValue } from '../../internal.js'

export const arithmeticOperators = {

  /**
   * Returns the absolute value of a number.
   * https://docs.mongodb.com/manual/reference/operator/aggregation/abs/#exp._S_abs
   * @param obj
   * @param expr
   * @return {Number|null|NaN}
   */
  $abs (obj, expr) {
    let val = computeValue(obj, expr)
    return (val === null || val === undefined) ? null : Math.abs(val)
  },

  /**
   * Computes the sum of an array of numbers.
   *
   * @param obj
   * @param expr
   * @returns {Object}
   */
  $add (obj, expr) {
    let args = computeValue(obj, expr)
    return reduce(args, (acc, num) => acc + num, 0)
  },

  /**
   * Returns the smallest integer greater than or equal to the specified number.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $ceil (obj, expr) {
    let arg = computeValue(obj, expr)
    if (isNaN(arg)) return NaN
    if (isNil(arg)) return null
    assert(isNumber(arg), '$ceil must be a valid expression that resolves to a number.')
    return Math.ceil(arg)
  },

  /**
   * Takes two numbers and divides the first number by the second.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $divide (obj, expr) {
    let args = computeValue(obj, expr)
    return args[0] / args[1]
  },

  /**
   * Raises Euler’s number (i.e. e ) to the specified exponent and returns the result.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $exp (obj, expr) {
    let arg = computeValue(obj, expr)
    if (isNaN(arg)) return NaN
    if (isNil(arg)) return null
    assert(isNumber(arg), '$exp must be a valid expression that resolves to a number.')
    return Math.exp(arg)
  },

  /**
   * Returns the largest integer less than or equal to the specified number.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $floor (obj, expr) {
    let arg = computeValue(obj, expr)
    if (isNaN(arg)) return NaN
    if (isNil(arg)) return null
    assert(isNumber(arg), '$floor must be a valid expression that resolves to a number.')
    return Math.floor(arg)
  },

  /**
   * Calculates the natural logarithm ln (i.e loge) of a number and returns the result as a double.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $ln (obj, expr) {
    let arg = computeValue(obj, expr)
    if (isNaN(arg)) return NaN
    if (isNil(arg)) return null
    assert(isNumber(arg), '$ln must be a valid expression that resolves to a number.')
    return Math.log(arg)
  },

  /**
   * Calculates the log of a number in the specified base and returns the result as a double.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $log (obj, expr) {
    let args = computeValue(obj, expr)
    assert(isArray(args) && args.length === 2, '$log must be a valid expression that resolves to an array of 2 items')
    if (args.some(isNaN)) return NaN
    if (args.some(isNil)) return null
    assert(args.every(isNumber), '$log expression must resolve to array of 2 numbers')
    return Math.log10(args[0]) / Math.log10(args[1])
  },

  /**
   * Calculates the log base 10 of a number and returns the result as a double.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $log10 (obj, expr) {
    let arg = computeValue(obj, expr)
    if (isNaN(arg)) return NaN
    if (isNil(arg)) return null
    assert(isNumber(arg), '$log10 must be a valid expression that resolves to a number.')
    return Math.log10(arg)
  },

  /**
   * Takes two numbers and calculates the modulo of the first number divided by the second.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $mod (obj, expr) {
    let args = computeValue(obj, expr)
    return args[0] % args[1]
  },

  /**
   * Computes the product of an array of numbers.
   *
   * @param obj
   * @param expr
   * @returns {Object}
   */
  $multiply (obj, expr) {
    let args = computeValue(obj, expr)
    return reduce(args, (acc, num) => acc * num, 1)
  },

  /**
   * Raises a number to the specified exponent and returns the result.
   *
   * @param obj
   * @param expr
   * @returns {Object}
   */
  $pow (obj, expr) {
    let args = computeValue(obj, expr)

    assert(isArray(args) && args.length === 2 && args.every(isNumber), '$pow expression must resolve to an array of 2 numbers')
    assert(!(args[0] === 0 && args[1] < 0), '$pow cannot raise 0 to a negative exponent')

    return Math.pow(args[0], args[1])
  },

  /**
   * Calculates the square root of a positive number and returns the result as a double.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $sqrt (obj, expr) {
    let n = computeValue(obj, expr)
    if (isNaN(n)) return NaN
    if (isNil(n)) return null
    assert(isNumber(n) && n > 0, '$sqrt expression must resolve to non-negative number.')
    return Math.sqrt(n)
  },

  /**
   * Takes an array that contains two numbers or two dates and subtracts the second value from the first.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $subtract (obj, expr) {
    let args = computeValue(obj, expr)
    return args[0] - args[1]
  },

  /**
   * Truncates a number to its integer.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $trunc (obj, expr) {
    let n = computeValue(obj, expr)
    if (isNaN(n)) return NaN
    if (isNil(n)) return null
    assert(isNumber(n) && n > 0, '$trunc must be a valid expression that resolves to a non-negative number.')
    return Math.trunc(n)
  }
}
