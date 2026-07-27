import { evalExpr } from "../../../core/_internal";
import { Any, AnyObject, Options } from "../../../types";
import { assert, isArray, isInteger, isNil } from "../../../util";
import { errExpectArray, errExpectInteger } from "../_internal";

const OP = "$arrayElemAt";

/**
 * Returns the element at the specified array index.
 */
export const $arrayElemAt = (
  obj: AnyObject,
  expr: Any,
  options: Options
): Any => {
  assert(isArray(expr) && expr.length === 2, `${OP} expects array(2)`);
  const args = evalExpr(obj, expr, options) as Any[];
  if (args.some(isNil)) return null;

  const foe = options.failOnError;
  const [arr, index] = args as [Any[], number];
  if (!isArray(arr)) return errExpectArray(foe, `${OP} arg1 <array>`);
  if (!isInteger(index)) return errExpectInteger(foe, `${OP} arg2 <index>`);

  if (index < 0 && Math.abs(index) <= arr.length) {
    return arr[(index + arr.length) % arr.length];
  } else if (index >= 0 && index < arr.length) {
    return arr[index];
  }
  return undefined;
};
