/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { isNil } from "../../../util";
import { TypeConvertError } from "./_internal";

/**
 * Converts a value to a date. If the value cannot be converted to a date, $toDate errors. If the value is null or missing, $toDate returns null.
 *
 * @param obj
 * @param expr
 */
export function $toDate(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): Date | null {
  const val = computeValue(obj, expr, null, options) as string | number | Date;

  if (val instanceof Date) return val;
  if (isNil(val)) return null;

  const d = new Date(val);
  const n = d.getTime();
  if (!isNaN(n)) return d;

  throw new TypeConvertError(`cannot convert '${val}' to date`);
}
