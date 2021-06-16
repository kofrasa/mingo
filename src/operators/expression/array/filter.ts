// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { assert, isArray } from "../../../util";

/**
 * Selects a subset of the array to return an array with only the elements that match the filter condition.
 *
 * @param  {Object} obj  [description]
 * @param  {*} expr [description]
 * @return {*}      [description]
 */
export function $filter(
  obj: RawObject,
  expr: { input: RawArray; as: string; cond: AnyVal },
  options?: Options
): RawArray {
  const input = computeValue(obj, expr.input, null, options) as RawArray;

  assert(isArray(input), "$filter 'input' expression must resolve to an array");

  return input.filter((o: AnyVal) => {
    // inject variable
    const tempObj = {};
    tempObj["$" + expr.as] = o;
    return computeValue(tempObj, expr.cond, null, options) === true;
  });
}
