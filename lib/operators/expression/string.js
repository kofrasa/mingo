import { assert, each, err, getType, isEqual, isString, isNil, isNumber, isEmpty, inArray } from '../../util.js'
import { computeValue, resolve } from '../../internal.js'

export const stringOperators = {

  /**
   * Concatenates two strings.
   *
   * @param obj
   * @param expr
   * @returns {string|*}
   */
  $concat (obj, expr) {
    let args = computeValue(obj, expr)
    // does not allow concatenation with nulls
    if ([null, undefined].some(inArray.bind(null, args))) return null
    return args.join('')
  },

  /**
   * Searches a string for an occurrence of a substring and returns the UTF-8 code point index of the first occurence.
   * If the substring is not found, returns -1.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */
  $indexOfBytes (obj, expr) {
    let arr = computeValue(obj, expr)
    let errorMsg = '$indexOfBytes: expression resolves to invalid arguments'

    if (isNil(arr[0])) return null

    assert(isString(arr[0]) && isString(arr[1]), errorMsg)

    let str = arr[0]
    let searchStr = arr[1]
    let start = arr[2]
    let end = arr[3]

    let valid = isNil(start) || (isNumber(start) && start >= 0 && Math.round(start) === start)
    valid = valid && (isNil(end) || (isNumber(end) && end >= 0 && Math.round(end) === end))
    assert(valid, errorMsg)

    start = start || 0
    end = end || str.length

    if (start > end) return -1

    let index = str.substring(start, end).indexOf(searchStr)
    return (index > -1)
      ? index + start
      : index
  },

  /**
   * Splits a string into substrings based on a delimiter.
   * If the delimiter is not found within the string, returns an array containing the original string.
   *
   * @param  {Object} obj
   * @param  {Array} expr
   * @return {Array} Returns an array of substrings.
   */
  $split (obj, expr) {
    let args = computeValue(obj, expr)
    if (isNil(args[0])) return null
    assert(args.every(isString), '$split: invalid argument')
    return args[0].split(args[1])
  },

  /**
   * Returns the number of UTF-8 encoded bytes in the specified string.
   *
   * @param  {Object} obj
   * @param  {String} expr
   * @return {Number}
   */
  $strLenBytes (obj, expr) {
    return ~-encodeURI(computeValue(obj, expr)).split(/%..|./).length
  },

  /**
   * Returns the number of UTF-8 code points in the specified string.
   *
   * @param  {Object} obj
   * @param  {String} expr
   * @return {Number}
   */
  $strLenCP (obj, expr) {
    return computeValue(obj, expr).length
  },

  /**
   * Compares two strings and returns an integer that reflects the comparison.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $strcasecmp (obj, expr) {
    let args = computeValue(obj, expr)
    let a = args[0]
    let b = args[1]
    if (isEqual(a, b) || args.every(isNil)) return 0
    assert(args.every(isString), '$strcasecmp: invalid argument')
    a = a.toUpperCase()
    b = b.toUpperCase()
    return (a > b && 1) || (a < b && -1) || 0
  },

  /**
   * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
   * The index is zero-based.
   *
   * @param obj
   * @param expr
   * @returns {string}
   */
    $substrBytes (obj, expr) {
    let args = computeValue(obj, expr)
    let s = args[0]
    let index = args[1]
    let count = args[2]
    assert(isString(s) && isNumber(index) && index >= 0 && isNumber(count) && count >= 0, '$substrBytes: invalid arguments')
    let buf = utf8Encode(s)
    let validIndex = []
    let acc = 0
    for (let i = 0; i < buf.length; i++) {
      validIndex.push(acc)
      acc += buf[i].length
    }
    let begin = validIndex.indexOf(index)
    let end = validIndex.indexOf(index + count)
    assert(begin > -1 && end > -1, '$substrBytes: Invalid range, start or end index is a UTF-8 continuation byte.')
    return s.substring(begin, end)
  },

  /**
   * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
   * The index is zero-based.
   *
   * @param obj
   * @param expr
   * @returns {string}
   */
  $substr (obj, expr) {
    let args = computeValue(obj, expr)
    let s = args[0]
    let index = args[1]
    let count = args[2]
    if (isString(s)) {
      if (index < 0) {
        return ''
      } else if (count < 0) {
        return s.substr(index)
      } else {
        return s.substr(index, count)
      }
    }
    return ''
  },

  $substrCP (obj, expr) {
    return this.$substr(obj, expr)
  },

  /**
   * Converts a string to lowercase.
   *
   * @param obj
   * @param expr
   * @returns {string}
   */
  $toLower (obj, expr) {
    let value = computeValue(obj, expr)
    return isEmpty(value) ? '' : value.toLowerCase()
  },

  /**
   * Converts a string to uppercase.
   *
   * @param obj
   * @param expr
   * @returns {string}
   */
  $toUpper (obj, expr) {
    let value = computeValue(obj, expr)
    return isEmpty(value) ? '' : value.toUpperCase()
  }
}

const UTF8_MASK = [0xC0, 0xE0, 0xF0]
// encodes a unicode code point to a utf8 byte sequence
// https://encoding.spec.whatwg.org/#utf-8
function toUtf8 (n) {
  if (n < 0x80) return [n]
  let count = ((n < 0x0800) && 1) || ((n < 0x10000) && 2) || 3
  const offset = UTF8_MASK[count - 1]
  let utf8 = [(n >> (6 * count)) + offset]
  while (count > 0) utf8.push(0x80 | ((n >> (6 * --count)) & 0x3F))
  return utf8
}

function utf8Encode(s) {
  let buf = []
  for (let i = 0, len = s.length; i < len; i++) {
    buf.push(toUtf8(s.codePointAt(i)))
  }
  return buf
}