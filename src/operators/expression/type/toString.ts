/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { isNil } from "../../../util";
import { $dateToString } from "../date/dateToString";

export function $toString(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): string | null {
  const val = computeValue(obj, expr, null, options);
  if (isNil(val)) return null;

  if (val instanceof Date) {
    const dateExpr = {
      date: expr,
      format: "%Y-%m-%dT%H:%M:%S.%LZ"
    };
    return $dateToString(obj, dateExpr, options);
  } else {
    return val.toString();
  }
}
