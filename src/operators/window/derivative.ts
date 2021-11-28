import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { $first, $last } from "../accumulator";
import { Duration, MILLIS_PER_DAY } from "../expression/date/_internal";
import { WindowOperatorInput } from "../pipeline/_internal";

// millis map to diffirent time units
const MILLIS_PER_UNIT: Record<string, number> = {
  week: MILLIS_PER_DAY * 7,
  day: MILLIS_PER_DAY,
  hour: MILLIS_PER_DAY / 24,
  minute: 60000,
  second: 1000,
  millisecond: 1,
};

/**
 * Returns the average rate of change within the specified window
 */
export function $derivative(
  obj: RawObject,
  collection: RawObject[],
  expr: WindowOperatorInput,
  options?: Options
): AnyVal {
  const { input, unit } = expr.inputExpr as {
    input: AnyVal;
    unit?: Duration;
  };
  const sortKey = "$" + Object.keys(expr.parentExpr.sortBy)[0];

  const y1 = $first(collection, input, options) as number;
  const y2 = $last(collection, input, options) as number;

  // ensure values are represented as numbers for dates
  const x1 = +($first(collection, sortKey, options) as Date | number);
  const x2 = +($last(collection, sortKey, options) as Date | number);

  // convert from millis to the unit.
  const deltaX = (x2 - x1) / (MILLIS_PER_UNIT[unit] || 1);

  return (y2 - y1) / deltaX;
}
