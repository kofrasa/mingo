// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { $dateAdd } from "..";
import { Duration } from "./_internal";

/**
 * Decrements a Date object by a specified number of time units.
 * @param obj
 * @param expr
 */
export function $dateSubtract(
  obj: RawObject,
  expr: {
    startDate: Date | number; // timestamp in seconds.
    unit: Duration;
    amount: number;
    timezone?: string;
  },
  options?: Options
): AnyVal {
  return $dateAdd(obj, { ...expr, amount: -1 * expr.amount }, options);
}
