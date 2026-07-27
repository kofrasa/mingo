import { evalExpr } from "../../../core/_internal";
import { Any, AnyObject, Options } from "../../../types";
import { isInteger, isNil } from "../../../util";
import { errExpectInteger } from "../_internal";

/**
 * Returns the result of a bitwise not operation on a single argument or an array that contains a single int or long value.
 */
export const $bitNot = (obj: AnyObject, expr: Any, options: Options): Any => {
  const n = evalExpr(obj, expr, options) as number;
  if (isNil(n)) return null;
  if (!isInteger(n)) return errExpectInteger(options.failOnError, "$bitNot");
  return ~n;
};
