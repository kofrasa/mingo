// https://www.mongodb.com/docs/manual/reference/operator/aggregation/percentile/
import { AccumulatorOperator, Options } from "../../core";
import { AnyVal, RawArray, RawObject } from "../../types";
import { assert, isNumber } from "../../util";
import { $push } from "./push";

/**
 * Returns an array of scalar values that correspond to specified percentile values.
 *
 * @param collection The collection of objects.
 * @param expr The operator expression.
 * @param options Options to use for processing.
 * @returns {Object|*}
 */
export const $percentile: AccumulatorOperator<number[]> = (
  collection: RawObject[],
  expr: { input: AnyVal; p: RawArray },
  options: Options
): number[] => {
  // MongoDB uses the t-digest algorithm to estimate percentiles.
  // Since this library expects all data in memory we compute percentiles using linear interpolation method.
  // see https://en.wikipedia.org/wiki/Percentile#The_linear_interpolation_between_closest_ranks_method
  const X = $push(collection, expr.input, options).filter(isNumber).sort();
  const centiles = $push(expr.p, "$$CURRENT", options).filter(isNumber);
  return centiles.map(p => {
    assert(
      p > 0 && p <= 1,
      `percentile value must be between 0 and 1 (inclusive): found ${p}.`
    );
    // compute rank for the percentile
    const r = p * (X.length - 1) + 1;
    // get the integer part
    const ri = Math.floor(r);
    // return zero for NaN values when X[ri+1] is undefined.
    return r === ri ? X[r - 1] : X[ri] + (r % 1) * (X[ri + 1] - X[ri] || 0);
  });
};
