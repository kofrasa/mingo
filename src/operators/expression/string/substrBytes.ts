import { evalExpr } from "../../../core/_internal";
import { Any, AnyObject, Options } from "../../../types";
import { assert, isArray, isInteger, isNil, isString } from "../../../util";
import {
  errExpectInteger,
  errExpectString,
  errInvalidArgs
} from "../_internal";

const OP = "$substrBytes";

/**
 * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
 * The index is zero-based.
 *
 * See {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/substrBytes/}.
 */
export const $substrBytes = (obj: AnyObject, expr: Any, options: Options) => {
  assert(isArray(expr) && expr.length === 3, `${OP} expects array(3)`);
  const [s, index, count] = evalExpr(obj, expr, options) as [
    string,
    number,
    number
  ];
  const foe = options.failOnError;
  const nil = isNil(s);

  if (!nil && !isString(s)) return errExpectString(foe, `${OP} arg1 <string>`);
  if (!isInteger(index) || index < 0)
    return errExpectInteger(foe, `${OP} arg2 <index>`, { min: 0 });
  if (!isInteger(count) || count < 0)
    return errExpectInteger(foe, `${OP} arg3 <count>`, { min: 0 });

  if (nil) return "";

  let utf8Pos = 0;
  let start16: number = null as Any as number;
  let end16: number = null as Any as number;
  const err = `${OP} UTF-8 boundary falls inside a continuation byte`;

  for (let i = 0; i < s.length; ) {
    const cp = s.codePointAt(i);
    if (cp === undefined)
      return errInvalidArgs(foe, `${OP} byte index out of range`);
    const utf8Len = cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
    const utf16Len = cp > 0xffff ? 2 : 1;

    // Validate start boundary
    if (start16 === null) {
      if (index > utf8Pos && index < utf8Pos + utf8Len)
        return errInvalidArgs(foe, err);
      if (utf8Pos === index) {
        start16 = i;
      }
    }

    // Validate end boundary
    const endByte = index + count;
    if (start16 !== null && end16 === null) {
      if (endByte > utf8Pos && endByte < utf8Pos + utf8Len)
        return errInvalidArgs(foe, err);
      if (utf8Pos === endByte) {
        end16 = i;
        break;
      }
    }

    utf8Pos += utf8Len;
    i += utf16Len;
  }

  if (start16 === null) {
    // If byteIndex is exactly at the end of the UTF-8 stream, return empty string.
    if (index === utf8Pos) return "";
    return errInvalidArgs(foe, `${OP} byte index out of range`);
  }

  if (end16 === null) {
    // If endByte is exactly at the end of the UTF-8 stream, slice to end.
    const endByte = index + count;
    if (endByte !== utf8Pos)
      return errInvalidArgs(foe, `${OP} count extends beyond UTF-8 length`);
    end16 = s.length;
  }

  return s.slice(start16, end16);
};
