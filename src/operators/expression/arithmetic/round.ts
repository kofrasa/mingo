// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { assert, isNil, isNumber } from "../../../util";
import { truncate } from "./_internal";

/**
 * Rounds a number to to a whole integer or to a specified decimal place.
 * @param {*} obj
 * @param {*} expr
 */
export function $round(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number | null {
  const args = computeValue(obj, expr, null, options) as RawArray;
  const num = args[0] as number;
  const place = args[1] as number;
  if (isNil(num) || isNaN(num) || Math.abs(num) === Infinity) return num;
  assert(isNumber(num), "$round expression must resolve to a number.");

  return truncate(num, place, true);
}
