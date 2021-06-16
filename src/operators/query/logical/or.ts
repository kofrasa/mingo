// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/

import { Options } from "../../../core";
import { Query } from "../../../query";
import { RawObject } from "../../../types";
import { assert, Callback, isArray } from "../../../util";

/**
 * Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
 *
 * @param selector
 * @param value
 * @returns {Function}
 */
export function $or(
  selector: string,
  value: Array<RawObject>,
  options?: Options
): Callback<boolean> {
  assert(
    isArray(value),
    "Invalid expression. $or expects value to be an Array"
  );

  const queries = value.map((expr) => new Query(expr, options));

  return (obj: RawObject) => {
    for (let i = 0; i < queries.length; i++) {
      if (queries[i].test(obj)) {
        return true;
      }
    }
    return false;
  };
}
