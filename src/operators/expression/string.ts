/**
 * Strin Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { assert, isEqual, isString, isNil, isNumber, isEmpty, inArray } from '../../util'
import { computeValue } from '../../internal'

/**
 * Concatenates two strings.
 *
 * @param obj
 * @param expr
 * @returns {string|*}
 */
export function $concat(obj: object, expr: any): any {
  let args = computeValue(obj, expr)
  // does not allow concatenation with nulls
  if ([null, undefined].some(inArray.bind(null, args))) return null
  return args.join('')
}

/**
 * Searches a string for an occurrence of a substring and returns the UTF-8 code point index of the first occurence.
 * If the substring is not found, returns -1.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $indexOfBytes(obj: object, expr: any): any {
  let arr = computeValue(obj, expr)
  const errorMsg = '$indexOfBytes expression resolves to invalid an argument'

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
}

/**
 * Splits a string into substrings based on a delimiter.
 * If the delimiter is not found within the string, returns an array containing the original string.
 *
 * @param  {Object} obj
 * @param  {Array} expr
 * @return {Array} Returns an array of substrings.
 */
export function $split(obj: object, expr: any): any {
  let args = computeValue(obj, expr)
  if (isNil(args[0])) return null
  assert(args.every(isString), '$split expression must result to array(2) of strings')
  return args[0].split(args[1])
}

/**
 * Returns the number of UTF-8 encoded bytes in the specified string.
 *
 * @param  {Object} obj
 * @param  {String} expr
 * @return {Number}
 */
export function $strLenBytes(obj: object, expr: any): any {
  return ~-encodeURI(computeValue(obj, expr)).split(/%..|./).length
}

/**
 * Returns the number of UTF-8 code points in the specified string.
 *
 * @param  {Object} obj
 * @param  {String} expr
 * @return {Number}
 */
export function $strLenCP(obj: object, expr: any): any {
  return computeValue(obj, expr).length
}

/**
 * Compares two strings and returns an integer that reflects the comparison.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $strcasecmp(obj: object, expr: any): any {
  let args = computeValue(obj, expr)
  let a = args[0]
  let b = args[1]
  if (isEqual(a, b) || args.every(isNil)) return 0
  assert(args.every(isString), '$strcasecmp must resolve to array(2) of strings')
  a = a.toUpperCase()
  b = b.toUpperCase()
  return (a > b && 1) || (a < b && -1) || 0
}

const UTF8_MASK = [0xC0, 0xE0, 0xF0]
// encodes a unicode code point to a utf8 byte sequence
// https://encoding.spec.whatwg.org/#utf-8
function toUtf8(n: number): number[] {
  if (n < 0x80) return [n]
  let count = ((n < 0x0800) && 1) || ((n < 0x10000) && 2) || 3
  const offset = UTF8_MASK[count - 1]
  let utf8 = [(n >> (6 * count)) + offset]
  while (count > 0) utf8.push(0x80 | ((n >> (6 * --count)) & 0x3F))
  return utf8
}

function utf8Encode(s: string): number[][] {
  let buf = []
  for (let i = 0, len = s.length; i < len; i++) {
    buf.push(toUtf8(s.codePointAt(i)))
  }
  return buf
}

/**
 * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
 * The index is zero-based.
 *
 * @param obj
 * @param expr
 * @returns {string}
 */
export function $substrBytes(obj: object, expr: any): any {
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
  assert(begin > -1 && end > -1, '$substrBytes: invalid range, start or end index is a UTF-8 continuation byte.')
  return s.substring(begin, end)
}

/**
 * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
 * The index is zero-based.
 *
 * @param obj
 * @param expr
 * @returns {string}
 */
export function $substr(obj: object, expr: any): any {
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
}

export function $substrCP(obj: object, expr: any): any {
  return $substr(obj, expr)
}

/**
 * Converts a string to lowercase.
 *
 * @param obj
 * @param expr
 * @returns {string}
 */
export function $toLower(obj: object, expr: any): any {
  let value = computeValue(obj, expr)
  return isEmpty(value) ? '' : value.toLowerCase()
}

/**
 * Converts a string to uppercase.
 *
 * @param obj
 * @param expr
 * @returns {string}
 */
export function $toUpper(obj: object, expr: any): any {
  let value = computeValue(obj, expr)
  return isEmpty(value) ? '' : value.toUpperCase()
}

const WHITESPACE_CHARS = [
  0x0000, // '\0' Null character
  0x0020, // ' ', Space
  0x0009, // '\t' Horizontal tab
  0x000A, // '\n' Line feed/new line
  0x000B, // '\v' Vertical tab
  0x000C, // '\f' Form feed
  0x000D, // '\r' Carriage return
  0x00A0, // Non-breaking space
  0x1680, // Ogham space mark
  0x2000, // En quad
  0x2001, // Em quad
  0x2002, // En space
  0x2003, // Em space
  0x2004, // Three-per-em space
  0x2005, // Four-per-em space
  0x2006, // Six-per-em space
  0x2007, // Figure space
  0x2008, // Punctuation space
  0x2009, // Thin space
  0x200A  // Hair space
]

/**
 * Trims the resolved string
 *
 * @param obj
 * @param expr
 * @param options
 */
function trimString(obj: object, expr: any, options: { left: boolean, right: boolean }): string {
  let val = computeValue(obj, expr) || {}
  let s = val.input as string
  if (isNil(s)) return null

  let codepoints = isNil(val.chars) ? WHITESPACE_CHARS : val.chars.split('').map((c: string) => c.codePointAt(0))

  let i = 0;
  let j = s.length - 1

  while (options.left && i <= j && codepoints.indexOf(s[i].codePointAt(0)) !== -1) i++
  while (options.right && i <= j && codepoints.indexOf(s[j].codePointAt(0)) !== -1) j--

  return s.substring(i, j+1)
}

/**
 * Removes whitespace characters, including null, or the specified characters from the beginning and end of a string.
 *
 * @param obj
 * @param expr
 */
export function $trim(obj: object, expr: any): any {
  return trimString(obj, expr, { left: true, right: true})
}

/**
 * Removes whitespace characters, including null, or the specified characters from the beginning of a string.
 *
 * @param obj
 * @param expr
 */
export function $ltrim(obj: object, expr: any): any {
  return trimString(obj, expr, { left: true, right: false})
}

/**
 * Removes whitespace characters, including null, or the specified characters from the end of a string.
 *
 * @param obj
 * @param expr
 */
export function $rtrim(obj: object, expr: any): any {
  return trimString(obj, expr, { left: false, right: true})
}