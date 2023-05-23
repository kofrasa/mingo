// Custom Aggregation Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#custom-aggregation-expression-operators

import { ComputeOptions, computeValue, Options } from "../../core";
import { AnyVal, Callback, RawArray, RawObject } from "../../types";
import { assert } from "../../util";

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
  options: Options
): AnyVal {
  assert(
    !!options && options.scriptEnabled,
    "$accumulator operator requires 'scriptEnabled' option to be true"
  );

  if (collection.length == 0) return expr.initArgs;

  const copts = ComputeOptions.init(options);

  const initArgs = computeValue(
    {},
    expr.initArgs || [],
    null,
    copts.update(copts?.local?.groupId || {})
  ) as RawArray;

  let state = expr.init.call(null, ...initArgs) as AnyVal;

  for (const doc of collection) {
    // get arguments for document
    const args = computeValue(
      doc,
      expr.accumulateArgs,
      null,
      copts.update(doc)
    ) as RawArray;
    // update the state with each documents value
    // eslint-disable-next-line
    state = expr.accumulate.call(null, ...[state, ...args]) as AnyVal;
  }

  return (expr.finalize ? expr.finalize.call(null, state) : state) as AnyVal;
}
