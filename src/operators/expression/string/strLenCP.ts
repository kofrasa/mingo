import { evalExpr } from "../../../core/_internal";
import { Any, AnyObject, Options } from "../../../types";
import { isString } from "../../../util";
import { errExpectString } from "../_internal";

/**
 * Returns the number of UTF-8 code points in the specified string.
 */
export const $strLenCP = (obj: AnyObject, expr: Any, options: Options): Any => {
  const s = evalExpr(obj, expr, options) as string;
  if (!isString(s)) return errExpectString(options.failOnError, "$strLenCP");
  // Count Unicode code points, not UTF-16 code units. `String.length` counts
  // code units, so any non-BMP code point (emoji, CJK Ext B-G, U+10000+) is
  // double-counted. MongoDB $strLenCP counts code points.
  return [...s].length;
};
