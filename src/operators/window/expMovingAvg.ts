import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { $push } from "../accumulator";
import { WindowOperatorInput } from "../pipeline/_internal";

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
  const { input, N, alpha } = expr.inputExpr as {
    input: AnyVal;
    N: number;
    alpha: number;
  };

  const series = $push(
    collection.slice(0, (obj[expr.indexKey] as number) + 1),
    input,
    options
  ) as number[];

  let result = series[0];
  const weight = N != undefined ? 2 / (N + 1) : alpha;

  for (let i = 1; i < series.length; i++) {
    result = series[i] * weight + result * (1 - weight);
  }

  return result;
}
