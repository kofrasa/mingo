import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { $push } from "../accumulator";
import { WindowOperatorInput } from "../pipeline/_internal";
import { MILLIS_PER_UNIT, TimeUnit } from "./_internal";

/**
 * Returns the approximation of the area under a curve.
 */
export function $integral(
  obj: RawObject,
  collection: RawObject[],
  expr: WindowOperatorInput,
  options?: Options
): AnyVal {
  const { input, unit } = expr.inputExpr as {
    input: AnyVal;
    unit?: TimeUnit;
  };
  const sortKey = "$" + Object.keys(expr.parentExpr.sortBy)[0];

  const y = $push(collection, input, options) as number[];
  // ensure values are represented as numbers for dates
  const x = $push(collection, sortKey, options).map((n: Date | number) => +n);

  let result = 0;
  const size = collection.length;

  for (let k = 1; k < size; k++) {
    // convert from millis to the unit.
    const deltaX = (x[k] - x[k - 1]) / (MILLIS_PER_UNIT[unit] || 1);
    result += 0.5 * (y[k - 1] + y[k]) * deltaX;
  }

  return result;
}
