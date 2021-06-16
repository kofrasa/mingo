// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

import { Options } from "../../../core";
import { AnyVal } from "../../../types";
import { Callback, isFunction } from "../../../util";

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
  let f: Function;
  if (!isFunction(value)) {
    f = new Function("return " + value + ";");
  } else {
    f = value as Function;
  }
  return (obj) => f.call(obj) === true;
}
