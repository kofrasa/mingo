// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { assert, Callback, isArray } from "../../../util";
import { $or } from "./or";

/**
 * Joins query clauses with a logical NOR returns all documents that fail to match both clauses.
 *
 * @param selector
 * @param value
 * @returns {Function}
 */
export function $nor(
  selector: string,
  value: Array<RawObject>,
  options?: Options
): Callback<boolean> {
  assert(
    isArray(value),
    "Invalid expression. $nor expects value to be an Array"
  );
  const f: Callback<boolean> = $or("$or", value, options);
  return (obj: AnyVal) => !f(obj);
}
