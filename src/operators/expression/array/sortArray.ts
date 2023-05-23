// https://www.mongodb.com/docs/manual/reference/operator/aggregation/sortArray/#mongodb-expression-exp.-sortArray

import { Aggregator } from "../../../aggregator";
import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { assert, compare, isArray, isNil, isObject } from "../../../util";

/**
 * Sorts an array based on its elements. The sort order is user specified.
 *
 * @param obj The target object
 * @param expr The expression argument
 * @param options Options
 * @returns
 */
export function $sortArray(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  const { input, sortBy } = computeValue(obj, expr, null, options) as {
    input: RawArray;
    sortBy: RawObject | number;
  };

  if (isNil(input)) return null;
  assert(isArray(input), "$sortArray expression must resolve to an array");

  if (isObject(sortBy)) {
    return new Aggregator([{ $sort: sortBy }]).run(input);
  }

  const result = [...input];
  result.sort(compare);
  if (sortBy === -1) result.reverse();
  return result;
}
