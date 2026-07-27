import { ComputeOptions, evalExpr } from "../../../core/_internal";
import { Any, AnyObject, Options } from "../../../types";
import {
  assert,
  has,
  isArray,
  isInteger,
  isNil,
  isObject,
  truthy
} from "../../../util/_internal";
import { errExpectArray, errExpectInteger } from "../_internal";

/**
 * Selects a subset of the array to return an array with only the elements that match the filter condition.
 */
export const $filter = (
  obj: AnyObject,
  expr: { input: Any; as?: string; cond: Any; limit?: Any },
  options: Options
) => {
  assert(
    isObject(expr) && has(expr, "input", "cond"),
    "$filter expects object { input, as, cond, limit }"
  );
  const input = evalExpr(obj, expr.input, options) as Any[];
  const foe = options.failOnError;

  if (isNil(input)) return null;
  if (!isArray(input)) return errExpectArray(foe, "$filter 'input'");

  const limit = (expr.limit as number) ?? Math.max(input.length, 1);
  if (!isInteger(limit) || limit < 1)
    return errExpectInteger(foe, "$filter 'limit'", { min: 1 });

  // exit early
  if (input.length === 0) return [];

  const copts = ComputeOptions.init(options);
  const k = expr?.as || "this";
  const locals = { variables: {} as AnyObject };

  const res: Any[] = [];

  for (let i = 0, j = 0; i < input.length && j < limit; i++) {
    locals.variables[k] = input[i];
    const cond = evalExpr(obj, expr.cond, copts.update(locals));
    // allow empty strings only in strict MongoDB mode (default).
    if (truthy(cond, options.useStrictMode)) {
      res.push(input[i]);
      j++;
    }
  }

  return res;
};
