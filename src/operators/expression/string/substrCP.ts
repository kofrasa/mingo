/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { $substr } from "./substr";

export function $substrCP(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  return $substr(obj, expr, options);
}
