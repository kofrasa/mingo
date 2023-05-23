// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { $dateAdd } from "./dateAdd";

/**
 * Decrements a Date object by a specified number of time units.
 * @param obj
 * @param expr
 */
export function $dateSubtract(
  obj: RawObject,
  expr: RawObject,
  options: Options
): AnyVal {
  const amount = computeValue(obj, expr?.amount, null, options) as number;
  return $dateAdd(obj, { ...expr, amount: -1 * amount }, options);
}
