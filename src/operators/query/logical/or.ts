// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/

import { Options } from "../../../core";
import { Query } from "../../../query";
import { Callback, RawObject } from "../../../types";
import { assert, isArray } from "../../../util";

/**
 * Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
 *
 * @param selector
 * @param rhs
 * @returns {Function}
 */
export function $or(
  _: string,
  rhs: Array<RawObject>,
  options: Options
): Callback<boolean> {
  assert(isArray(rhs), "Invalid expression. $or expects value to be an Array");
  const queries = rhs.map(expr => new Query(expr, options));
  return (obj: RawObject) => queries.some(q => q.test(obj));
}
