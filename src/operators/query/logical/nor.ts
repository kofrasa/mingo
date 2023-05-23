// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/

import { Options } from "../../../core";
import { AnyVal, Callback, RawObject } from "../../../types";
import { assert, isArray } from "../../../util";
import { $or } from "./or";

/**
 * Joins query clauses with a logical NOR returns all documents that fail to match both clauses.
 *
 * @param selector
 * @param rhs
 * @returns {Function}
 */
export function $nor(
  _: string,
  rhs: Array<RawObject>,
  options: Options
): Callback<boolean> {
  assert(
    isArray(rhs),
    "Invalid expression. $nor expects value to be an array."
  );
  const f: Callback<boolean> = $or("$or", rhs, options);
  return (obj: AnyVal) => !f(obj);
}
