import { Query } from "../../../query";
import { AnyObject, Options, Predicate } from "../../../types";
import { assert, isArray } from "../../../util";

/**
 * Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
 *
 * @param selector
 * @param rhs
 * @returns {Function}
 */
export const $and = (
  _: string,
  rhs: AnyObject[],
  options: Options
): Predicate => {
  assert(isArray(rhs), "$and expects value to be an Array.");
  const queries = rhs.map(expr => new Query(expr, options));
  return (obj: AnyObject) => queries.every(q => q.test(obj));
};
