import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { hashCode } from "../../util";
import { $push } from "../accumulator";
import { WindowOperatorInput } from "../pipeline/_internal";

// internal cache to store precomputed series once to avoid O(N^2) calls to over the collection
const cache: Record<string, number[]> = {};

/**
 * Returns the exponential moving average of numeric expressions applied to documents
 * in a partition defined in the $setWindowFields stage.
 */
export function $expMovingAvg(
  obj: RawObject,
  collection: RawObject[],
  expr: WindowOperatorInput,
  options?: Options
): AnyVal {
  const key = hashCode(collection[0]);
  try {
    const { input, N, alpha } = expr.inputExpr as {
      input: AnyVal;
      N: number;
      alpha: number;
    };

    // compute the entire series once and cache
    if (obj[expr.indexKey] === 0) {
      cache[key] = $push(collection, input, options) as number[];
    }

    const series = cache[key].slice(0, (obj[expr.indexKey] as number) + 1);
    let result = series[0];
    const weight = N != undefined ? 2 / (N + 1) : alpha;

    for (let i = 1; i < series.length; i++) {
      result = series[i] * weight + result * (1 - weight);
    }

    return result;
  } finally {
    if (obj[expr.indexKey] == collection.length - 1) {
      delete cache[key];
    }
  }
}
