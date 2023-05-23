// $elemMatch operator. https://docs.mongodb.com/manual/reference/operator/projection/elemMatch/#proj._S_elemMatch

import { Options } from "../../core";
import { Query } from "../../query";
import { AnyVal, RawArray, RawObject } from "../../types";
import { assert, resolve } from "../../util";

/**
 * Projects only the first element from an array that matches the specified $elemMatch condition.
 *
 * @param obj
 * @param field
 * @param expr
 * @returns {*}
 */
export function $elemMatch(
  obj: RawObject,
  expr: RawObject,
  field: string,
  options: Options
): AnyVal {
  const arr = resolve(obj, field) as Array<RawObject>;
  const query = new Query(expr, options);

  assert(arr instanceof Array, "$elemMatch: argument must resolve to array");
  const result: RawArray = [];
  for (let i = 0; i < (arr as RawArray).length; i++) {
    if (query.test(arr[i])) {
      // MongoDB projects only the first nested document when using this operator.
      // For some use cases this can lead to complicated queries to selectively project nested documents.
      // When strict mode is disabled, we return all matching nested documents.
      if (options.useStrictMode) return [arr[i]] as RawArray;
      result.push(arr[i]);
    }
  }
  return result.length > 0 ? result : undefined;
}
