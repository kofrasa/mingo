// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { computeDate, isoWeek } from "./_internal";

/**
 * Returns the week of the year for a date as a number between 0 and 53.
 * Weeks begin on Sundays, and week 1 begins with the first Sunday of the year. Days preceding the first Sunday of the year are in week 0
 * @param obj
 * @param expr
 */
export function $week(obj: RawObject, expr: AnyVal, options: Options): number {
  const d = computeDate(obj, expr, options);
  const result = isoWeek(d);
  // check for starting of year and adjust accordingly
  if (d.getUTCDay() > 0 && d.getUTCDate() == 1 && d.getUTCMonth() == 0)
    return 0;
  // adjust for week start on Sunday
  if (d.getUTCDay() == 0) return result + 1;
  // else
  return result;
}
