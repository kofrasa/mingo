// https://www.mongodb.com/docs/manual/reference/operator/aggregation/lastN/
import { ComputeOptions, computeValue, Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { $push } from "./push";

interface InputExpr {
  n: AnyVal;
  input: AnyVal;
}

/**
 * Returns an aggregation of the last n elements within a group. The elements returned are meaningful only if in a specified sort order.
 * If the group contains fewer than n elements, $lastN returns all elements in the group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
export function $lastN(
  collection: RawObject[],
  expr: InputExpr,
  options: Options
): AnyVal[] {
  const copts = ComputeOptions.init(options);
  const m = collection.length;
  const n = computeValue(copts?.local?.groupId, expr.n, null, copts) as number;
  return $push(
    m <= n ? collection : collection.slice(m - n),
    expr.input,
    options
  );
}
