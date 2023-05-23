// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

import { Options } from "../../../core";
import { AnyVal, Callback, Predicate } from "../../../types";
import { assert, isFunction, truthy } from "../../../util";

/* eslint-disable */

/**
 * Matches documents that satisfy a JavaScript expression.
 *
 * @param selector
 * @param rhs
 * @returns {Function}
 */
export function $where(
  _: string,
  rhs: AnyVal,
  options: Options
): Callback<boolean> {
  assert(
    options.scriptEnabled,
    "$where operator requires 'scriptEnabled' option to be true"
  );
  const f = rhs as Predicate<AnyVal>;
  assert(isFunction(f), "$where only accepts a Function object");
  return (obj) => truthy(f.call(obj), options?.useStrictMode);
}
