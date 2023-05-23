// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { ComputeOptions, computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { assert, isArray, isNil } from "../../../util";

/**
 * Applies an expression to each element in an array and combines them into a single value.
 *
 * @param {Object} obj
 * @param {*} expr
 */
export function $reduce(
  obj: RawObject,
  expr: RawObject,
  options: Options
): AnyVal {
  const copts = ComputeOptions.init(options);
  const input = computeValue(obj, expr.input, null, copts) as AnyVal[];
  const initialValue = computeValue(obj, expr.initialValue, null, copts);
  const inExpr = expr["in"];

  if (isNil(input)) return null;
  assert(isArray(input), "$reduce 'input' expression must resolve to an array");

  return input.reduce((acc, n) => {
    return computeValue(
      n,
      inExpr,
      null,
      copts.update(copts.root, {
        variables: { value: acc }
      })
    );
  }, initialValue);
}
