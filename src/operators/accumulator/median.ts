// https://www.mongodb.com/docs/manual/reference/operator/aggregation/median
import { AccumulatorOperator, Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { isNumber } from "../../util";
import { $push } from "./push";

/**
 * Returns the median of the dataset. The 'expr.method' defaults to "approximate" to return a median value from the dataset.
 *
 * If 'expr.method' is "approximate", we return the smallest of the middle values when dataset is even.
 * If 'expr.method' is "exact", we return the average of the middle values when dataset is even.
 * For an odd dataset, the middle value is always returned regardless of 'expr.method'.
 *
 * @param collection The collection of objects.
 * @param expr The operator expression.
 * @param options Options to use for processing.
 * @returns {Number}
 */
export const $median: AccumulatorOperator<number> = (
  collection: RawObject[],
  expr: { input: AnyVal; method: "approximate" | "exact" },
  options: Options
): number => {
  const X = $push(collection, expr.input, options).filter(isNumber).sort();
  const mid = X.length / 2;
  const method = expr.method || "approximate";
  const [lo, hi] = [Math.floor(mid), Math.ceil(mid)];
  switch (method) {
    case "exact":
      return (X[lo] + X[hi]) / 2;
    case "approximate": // return value from dataset
      return mid % 1 === 0 ? X[lo - 1] : X[lo];
  }
};
