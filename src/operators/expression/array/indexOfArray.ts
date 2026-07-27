import { evalExpr } from "../../../core/_internal";
import { Any, AnyObject, Options } from "../../../types";
import {
  assert,
  isArray,
  isEqual,
  isInteger,
  isNil
} from "../../../util/_internal";
import { errExpectArray, errExpectInteger } from "../_internal";

const OP = "$indexOfArray";

/**
 * Searches an array for an occurrence of a specified value and returns the array index of the first occurrence.
 * If the substring is not found, returns -1.
 */
export const $indexOfArray = (
  obj: AnyObject,
  expr: Any[],
  options: Options
) => {
  assert(
    isArray(expr) && expr.length > 1 && expr.length < 5,
    `${OP} expects array(4)`
  );
  const args = evalExpr(obj, expr, options) as Any[];
  const foe = options.failOnError;

  const arr = args[0] as Any[];
  if (isNil(arr)) return null;
  if (!isArray(arr)) return errExpectArray(foe, `${OP} arg1 <array>`);

  const search = args[1];
  const start = (args[2] ?? 0) as number;
  const end = (args[3] ?? arr.length) as number;

  if (!isInteger(start) || start < 0)
    return errExpectInteger(foe, `${OP} arg3 <start>`, { min: 1 });
  if (!isInteger(end) || end < 0)
    return errExpectInteger(foe, `${OP} arg4 <end>`, { min: 1 });

  if (start > end) return -1;

  const input = start > 0 || end < arr.length ? arr.slice(start, end) : arr;
  return input.findIndex((v: Any) => isEqual(v, search)) + start;
};
