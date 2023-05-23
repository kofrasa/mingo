// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { assert, isNil, isNumber } from "../../../util";
import { truncate } from "./_internal";

/**
 * Truncates a number to a whole integer or to a specified decimal place.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $trunc(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number | null {
  const arr = computeValue(obj, expr, null, options) as RawArray;
  const num = arr[0] as number;
  const places = arr[1] as number;
  if (isNil(num) || isNaN(num) || Math.abs(num) === Infinity) return num;
  assert(isNumber(num), "$trunc expression must resolve to a number.");
  assert(
    isNil(places) || (isNumber(places) && places > -20 && places < 100),
    "$trunc expression has invalid place"
  );
  return truncate(num, places, false);
}
