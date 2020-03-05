import { assert, isDate, isNil, isNumber, isArray, reduce } from '../../util.js'
import { computeValue } from '../../internal.js'

export const arithmeticOperators = {

  /**
   * Returns the absolute value of a number.
   * https://docs.mongodb.com/manual/reference/operator/aggregation/abs/#exp._S_abs
   *
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
    let foundDate = false
    let result = reduce(args, (acc, val) => {
      if (isDate(val)) {
        assert(!foundDate, "'$add' can only have one date value")
        foundDate = true
        val = val.getTime()
      }
      // assume val is a number
      acc += val
      return acc
    }, 0)
    return foundDate ? new Date(result) : result
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
    if (isNil(arg)) return null
    assert(isNumber(arg) || isNaN(arg), '$ceil expression must resolve to a number.')
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
    if (isNil(arg)) return null
    assert(isNumber(arg) || isNaN(arg), '$exp expression must resolve to a number.')
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
    if (isNil(arg)) return null
    assert(isNumber(arg) || isNaN(arg), '$floor expression must resolve to a number.')
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
    if (isNil(arg)) return null
    assert(isNumber(arg) || isNaN(arg), '$ln expression must resolve to a number.')
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
    const msg = '$log expression must resolve to array(2) of numbers'
    assert(isArray(args) && args.length === 2, msg)
    if (args.some(isNil)) return null
    assert(args.some(isNaN) || args.every(isNumber), msg)
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
    if (isNil(arg)) return null
    assert(isNumber(arg) || isNaN(arg), '$log10 expression must resolve to a number.')
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

    assert(isArray(args) && args.length === 2 && args.every(isNumber), '$pow expression must resolve to array(2) of numbers')
    assert(!(args[0] === 0 && args[1] < 0), '$pow cannot raise 0 to a negative exponent')

    return Math.pow(args[0], args[1])
  },

  /**
   * Rounds a number to to a whole integer or to a specified decimal place.
   * @param {*} obj
   * @param {*} expr
   */
  $round (obj, expr) {
    let args = computeValue(obj, expr)
    let num = args[0]
    let place = args[1]
    if (isNil(num) || num === NaN || Math.abs(num) === Infinity) return num
    assert(isNumber(num), '$round expression must resolve to a number.')
    return truncate(num, place, true)
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
    if (isNil(n)) return null
    assert(isNumber(n) && n > 0 || isNaN(n), '$sqrt expression must resolve to non-negative number.')
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
   * Truncates a number to a whole integer or to a specified decimal place.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $trunc (obj, expr) {
    let arr = computeValue(obj, expr)
    let num = arr[0]
    let places = arr[1]
    if (isNil(num) || num === NaN || Math.abs(num) === Infinity) return num
    assert(isNumber(num), '$trunc expression must resolve to a number.')
    assert(isNil(places) || (isNumber(places) && places > -20 && places < 100), "$trunc expression has invalid place")
    return truncate(num, places, false)
  }
}

/**
 * Truncates integer value to number of places. If roundOff is specified round value instead to the number of places
 * @param {Number} num
 * @param {Number} places
 * @param {Boolean} roundOff
 */
function truncate(num, places, roundOff) {
  places = places || 0
  let sign = Math.abs(num) === num ? 1 : -1
  num = Math.abs(num)

  let result = Math.trunc(num)
  let decimals = num - result

  if (places === 0) {
    let firstDigit = Math.trunc(10 * decimals)
    if (roundOff && result & 1 === 1 && firstDigit >= 5) {
      result++
    }
  } else if (places > 0) {
    let offset = Math.pow(10, places)
    let remainder = Math.trunc(decimals * offset)

    // last digit before cut off
    let lastDigit = Math.trunc(decimals * offset * 10) % 10

    // add one if last digit is greater than 5
    if (roundOff && lastDigit > 5) {
      remainder += 1
    }

    // compute decimal remainder and add to whole number
    result += (remainder / offset)
  } else if (places < 0) {
    // handle negative decimal places
    let offset = Math.pow(10, -1*places)
    let excess = result % offset
    result = Math.max(0, result - excess)

    // for negative values the absolute must increase so we round up the last digit if >= 5
    if (roundOff && sign === -1) {
      while (excess > 10) {
        excess -= excess % 10
      }
      if (result > 0 && excess >= 5) {
        result += offset
      }
    }
  }

  return result * sign
}