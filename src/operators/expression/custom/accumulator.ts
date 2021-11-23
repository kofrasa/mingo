// Custom Aggregation Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#custom-aggregation-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, Callback, RawArray, RawObject } from "../../../types";
import { assert } from "../../../util";

interface AccumulatorExpr {
  /** Function used to initialize the state. */
  readonly init: Callback<AnyVal>;
  /** Arguments passed to the init function. */
  readonly initArgs?: RawArray;
  /** Function used to accumulate documents.*/
  readonly accumulate: Callback<AnyVal>;
  /** Arguments passed to the accumulate function. */
  readonly accumulateArgs: RawArray;
  /** unused */
  readonly merge?: Callback<AnyVal>;
  /** Function used to update the result of the accumulation. */
  readonly finalize?: Callback<AnyVal>;
  readonly lang: "js";
}

/**
 * Defines a custom accumulator function.
 *
 * @param {Array} collection The input array
 * @param {*} expr The expression for the operator
 * @param {Options} options Options
 */
export function $accumulator(
  collection: RawObject[],
  expr: AccumulatorExpr,
  options?: Options
): AnyVal {
  assert(
    options.scriptEnabled,
    "$accumulator operator requires 'scriptEnabled' option to be true"
  );

  if (collection.length == 0) return expr.initArgs;

  const initArgs = computeValue(
    options["groupId"] || {},
    expr.initArgs || [],
    null,
    options
  ) as RawArray;

  let state = expr.init.call(null, ...initArgs) as AnyVal;

  for (let i = 0; i < collection.length; i++) {
    // get arguments for document
    const args = computeValue(
      collection[i],
      expr.accumulateArgs,
      null,
      options
    ) as RawArray;
    // update the state with each documents value
    state = expr.accumulate.call(null, ...[state, ...args]);
  }

  return (expr.finalize ? expr.finalize.call(null, state) : state) as AnyVal;
}
