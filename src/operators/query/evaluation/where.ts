// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

import { Options } from "../../../core";
import { AnyVal, Callback, Predicate } from "../../../types";
import { assert, isFunction } from "../../../util";

/* eslint-disable */

/**
 * Matches documents that satisfy a JavaScript expression.
 *
 * @param selector
 * @param value
 * @returns {Function}
 */
export function $where(
  selector: string,
  value: AnyVal,
  options?: Options
): Callback<boolean> {
  assert(options.scriptEnabled, "$where operator requires 'scriptEnabled' option to be true")
  const f = value as Predicate<AnyVal>;
  assert(isFunction(f), "$where only accepts a Function object")
  return (obj) => f.call(obj) === true;
}
