import { evalExpr } from "../../../core/_internal";
import { Any, AnyObject, Options } from "../../../types";
import { assert, isArray, isInteger, isNil } from "../../../util";
import { errExpectArray, errExpectInteger } from "../_internal";

/**
 * Returns a subset of an array.
 */
export const $slice = (obj: AnyObject, expr: Any, options: Options): Any => {
  assert(
    isArray(expr) && expr.length > 1 && expr.length < 4,
    "$slice expects array(3)"
  );
  const foe = options.failOnError;

  const args = evalExpr(obj, expr, options) as Any[];
  const arr = args[0] as Any[];
  let skip = args[1] as number;
  let limit = args[2] as number;

  // MongoDB $slice works a bit differently from Array.slice()
  // Uses [<array>, <limit>] or [ <array>, <skip>, <limit>]
  if (!isArray(arr)) return errExpectArray(foe, "$slice arg1 <array>");
  if (!isInteger(skip)) return errExpectInteger(foe, "$slice arg2 <n>");
  if (!isNil(limit) && !isInteger(limit))
    return errExpectInteger(foe, "$slice arg3 <n>");
  if (isNil(limit)) {
    if (skip < 0) {
      skip = Math.max(0, arr.length + skip);
    } else {
      limit = skip;
      skip = 0;
    }
  } else {
    if (skip < 0) {
      skip = Math.max(0, arr.length + skip);
    }
    if (limit < 1) {
      return errExpectInteger(foe, "$slice arg3 <n>", { min: 1 });
    }
    limit += skip;
  }

  return arr.slice(skip, limit);
};
