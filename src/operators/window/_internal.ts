import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { assert, groupBy, isEqual, isOperator } from "../../util";
import { $push } from "../accumulator";
import { MILLIS_PER_DAY } from "../expression/date/_internal";
import { WindowOperatorInput } from "../pipeline/_internal";

export type TimeUnit =
  | "week"
  | "day"
  | "hour"
  | "minute"
  | "second"
  | "millisecond";

// millis map to diffirent time units
export const MILLIS_PER_UNIT: Record<TimeUnit, number> = {
  week: MILLIS_PER_DAY * 7,
  day: MILLIS_PER_DAY,
  hour: MILLIS_PER_DAY / 24,
  minute: 60000,
  second: 1000,
  millisecond: 1,
};

/** Returns the position of a document in the $setWindowFields stage partition. */
export function rank(
  obj: RawObject,
  collection: RawObject[],
  expr: WindowOperatorInput,
  options: Options,
  dense: boolean
): AnyVal {
  const outputExpr = expr.parentExpr.output[expr.field];
  const operator = Object.keys(outputExpr).find(isOperator);
  assert(
    !outputExpr.window,
    `$${operator} does not support 'window' option in $setWindowFields`
  );

  const sortKey = "$" + Object.keys(expr.parentExpr.sortBy)[0];
  const sortValues = $push(collection, sortKey, options);
  const partitions = groupBy(
    collection,
    (_: RawObject, n: number) => sortValues[n],
    options.hashFunction
  );

  // same number of paritions as lenght means all sort keys are unique
  if (partitions.keys.length == collection.length) {
    return expr.documentNumber;
  }

  let rank = 1;
  const current = sortValues[expr.documentNumber - 1];

  for (let i = 0; i < partitions.keys.length; i++) {
    if (isEqual(current, partitions.keys[i])) {
      rank = dense ? i + 1 : rank;
      return rank;
    }
    rank += partitions.groups[i].length;
  }
  return rank;
}
