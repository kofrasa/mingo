import { evalExpr } from "../../../core/_internal";
import { Any, AnyObject, Options } from "../../../types";
import {
  assert,
  isArray,
  isInteger,
  isNil,
  isString
} from "../../../util/_internal";
import { errExpectInteger, errExpectString } from "../_internal";

const OP = "$indexOfBytes";

/**
 * Searches a string for an occurrence of a substring and returns the UTF-8 code point index of the first occurence.
 * If the substring is not found, returns -1.
 */
export const $indexOfBytes = (
  obj: AnyObject,
  expr: Any,
  options: Options
): Any => {
  assert(
    isArray(expr) && expr.length > 1 && expr.length < 5,
    `${OP} expects array(4)`
  );
  const args = evalExpr(obj, expr, options) as Any[];
  const foe = options.failOnError;

  const str = args[0] as string;
  if (isNil(str)) return null;
  if (!isString(str)) return errExpectString(foe, `${OP} arg1 <string>`);

  const search = args[1] as string;
  if (!isString(search)) return errExpectString(foe, `${OP} arg2 <search>`);

  const start = (args[2] as number) ?? 0;
  const end = (args[3] as number) ?? str.length;

  if (!isInteger(start) || start < 0)
    return errExpectInteger(foe, `${OP} arg3 <start>`, { min: 0 });
  if (!isInteger(end) || end < 0)
    return errExpectInteger(foe, `${OP} arg4 <end>`, { min: 0 });

  if (start > end) return -1;

  const index = str.substring(start, end).indexOf(search);
  return index > -1 ? index + start : index;
};
