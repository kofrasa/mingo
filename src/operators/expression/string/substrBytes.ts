/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { assert, isNumber, isString } from "../../../util";

const UTF8_MASK = [0xc0, 0xe0, 0xf0];

// encodes a unicode code point to a utf8 byte sequence
// https://encoding.spec.whatwg.org/#utf-8
function toUtf8(n: number): number[] {
  if (n < 0x80) return [n];
  let count = (n < 0x0800 && 1) || (n < 0x10000 && 2) || 3;
  const offset = UTF8_MASK[count - 1];
  const utf8 = [(n >> (6 * count)) + offset];
  while (count > 0) utf8.push(0x80 | ((n >> (6 * --count)) & 0x3f));
  return utf8;
}

function utf8Encode(s: string): number[][] {
  const buf: number[][] = [];
  for (let i = 0, len = s.length; i < len; i++) {
    buf.push(toUtf8(s.codePointAt(i)));
  }
  return buf;
}

/**
 * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
 * The index is zero-based.
 *
 * @param obj
 * @param expr
 * @returns {string}
 */
export function $substrBytes(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as RawArray;
  const s = args[0] as string;
  const index = args[1] as number;
  const count = args[2] as number;
  assert(
    isString(s) &&
      isNumber(index) &&
      index >= 0 &&
      isNumber(count) &&
      count >= 0,
    "$substrBytes: invalid arguments"
  );
  const buf = utf8Encode(s);
  const validIndex = [];
  let acc = 0;
  for (let i = 0; i < buf.length; i++) {
    validIndex.push(acc);
    acc += buf[i].length;
  }
  const begin = validIndex.indexOf(index);
  const end = validIndex.indexOf(index + count);
  assert(
    begin > -1 && end > -1,
    "$substrBytes: invalid range, start or end index is a UTF-8 continuation byte."
  );
  return s.substring(begin, end);
}
