// https://www.mongodb.com/docs/manual/reference/operator/aggregation/maxN
import { ComputeOptions, computeValue, Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { compare, isNil } from "../../util";
import { $push } from "./push";

interface InputExpr {
  n: AnyVal;
  input: AnyVal;
}

/**
 * Returns an aggregation of the maxmimum value n elements within a group.
 * If the group contains fewer than n elements, $maxN returns all elements in the group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
export function $maxN(
  collection: RawObject[],
  expr: InputExpr,
  options: Options
): AnyVal[] {
  const copts = ComputeOptions.init(options);
  const m = collection.length;
  const n = computeValue(copts?.local?.groupId, expr.n, null, copts) as number;
  const arr = $push(collection, expr.input, options).filter(o => !isNil(o));
  arr.sort((a, b) => -1 * compare(a, b));
  return m <= n ? arr : arr.slice(0, n);
}
