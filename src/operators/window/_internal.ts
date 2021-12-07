import { Options } from "../../core";
import { AnyVal, RawArray, RawObject } from "../../types";
import { assert, groupBy, hashCode, isEqual, isOperator } from "../../util";
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

type CacheValue = {
  partitions: { keys: RawArray; groups: RawArray[] };
  sortValues: RawArray;
  lastRank: number;
  groupIndex: number;
};

const rankCache: Record<string, CacheValue> = {};

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

  const key = hashCode(collection[0]);
  const sortKey = "$" + Object.keys(expr.parentExpr.sortBy)[0];

  try {
    if (expr.documentNumber === 1) {
      const sortValues = $push(collection, sortKey, options);
      const partitions = groupBy(
        collection,
        (_: RawObject, n: number) => sortValues[n],
        options.hashFunction
      );

      // cache the data for subsequent runs
      rankCache[key] = {
        partitions,
        sortValues,
        lastRank: 1,
        groupIndex: 0,
      };
    }

    const { partitions, sortValues, groupIndex, lastRank } = rankCache[key];

    // same number of paritions as lenght means all sort keys are unique
    if (partitions.keys.length == collection.length) {
      return expr.documentNumber;
    }

    let rank = lastRank;
    const current = sortValues[expr.documentNumber - 1];

    for (let i = groupIndex; i < partitions.keys.length; i++) {
      if (isEqual(current, partitions.keys[i])) {
        rankCache[key].groupIndex = i;
        rankCache[key].lastRank = dense ? i + 1 : rank;
        return rankCache[key].lastRank;
      }
      rank += partitions.groups[i].length;
    }
  } finally {
    if (expr.documentNumber == collection.length) {
      delete rankCache[key];
    }
  }
}
