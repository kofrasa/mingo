// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/

import { Options } from "../../../core";
import { Query } from "../../../query";
import { AnyVal, Callback, RawObject } from "../../../types";
import { normalize } from "../../../util";

/**
 * Inverts the effect of a query expression and returns documents that do not match the query expression.
 *
 * @param selector
 * @param rhs
 * @returns {Function}
 */
export function $not(
  selector: string,
  rhs: AnyVal,
  options: Options
): Callback<boolean> {
  const criteria = {};
  criteria[selector] = normalize(rhs);
  const query = new Query(criteria, options);
  return (obj: RawObject) => !query.test(obj);
}
