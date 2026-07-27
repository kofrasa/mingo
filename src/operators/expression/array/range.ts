import { evalExpr } from "../../../core/_internal";
import { Any, AnyObject, Options } from "../../../types";
import { assert, isArray, isInteger } from "../../../util";
import { errExpectInteger } from "../_internal";

/**
 * Returns an array whose elements are a generated sequence of numbers.
 */
export const $range = (obj: AnyObject, expr: Any, options: Options): Any => {
  assert(
    isArray(expr) && expr.length > 1 && expr.length < 4,
    "$range expects array(3)"
  );
  const [start, end, arg3] = evalExpr(obj, expr, options) as number[];
  const foe = options.failOnError;

  const step = arg3 ?? 1;

  if (!isInteger(start)) return errExpectInteger(foe, `$range arg1 <start>`);
  if (!isInteger(end)) return errExpectInteger(foe, `$range arg2 <end>`);
  if (!isInteger(step) || step === 0)
    return errExpectInteger(foe, `$range arg3 <step>`, { min: 0, max: 0 }); // special case: this means step cannot be zero
  const result = new Array<number>();
  let counter = start;
  while ((counter < end && step > 0) || (counter > end && step < 0)) {
    result.push(counter);
    counter += step;
  }

  return result;
};
