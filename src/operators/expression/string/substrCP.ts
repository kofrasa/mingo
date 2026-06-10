import { evalExpr } from "../../../core/_internal";
import { Any, AnyObject, Options } from "../../../types";
import { assert, isArray, isInteger, isNil, isString } from "../../../util";
import { errExpectNumber, errExpectString } from "../_internal";

const OP = "$substrCP";

/** Returns the substring of a string by UTF-8 code point index (zero-based).  */
export const $substrCP = (obj: AnyObject, expr: Any, options: Options): Any => {
  assert(isArray(expr) && expr.length === 3, `${OP} expects array(3)`);
  const [s, index, count] = evalExpr(obj, expr, options) as [
    string,
    number,
    number
  ];

  const nil = isNil(s);
  const foe = options.failOnError;
  if (!nil && !isString(s)) return errExpectString(foe, `${OP} arg1 <string>`);
  if (!isInteger(index)) return errExpectNumber(foe, `${OP} arg2 <index>`);
  if (!isInteger(count)) return errExpectNumber(foe, `${OP} arg3 <count>`);
  // If the argument resolves to a value of null or refers to a field that is missing, return an empty string.
  if (nil) return "";
  if (index < 0) return "";
  // Index by Unicode code points, not UTF-16 code units. `String.substring`
  // slices by code units and can split a surrogate pair, returning an invalid
  // unpaired surrogate. MongoDB $substrCP operates on code points.
  const codePoints = [...s];
  if (count < 0) return codePoints.slice(index).join("");
  return codePoints.slice(index, index + count).join("");
};
