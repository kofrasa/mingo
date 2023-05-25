import { Options } from "../../core";
import {
  AnyVal,
  Callback,
  GroupByOutput,
  RawArray,
  RawObject
} from "../../types";
import { groupBy, isEqual } from "../../util";
import { $push } from "../accumulator";
import { MILLIS_PER_DAY } from "../expression/date/_internal";
import { isUnbounded, WindowOperatorInput } from "../pipeline/_internal";

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
  millisecond: 1
};

// internal cache to store precomputed series once to avoid O(N^2) calls to over the collection
const memo = new WeakMap<RawArray, AnyVal>();

/**
 * Caches all computed values in a window sequence for reuse.
 * This is only useful for operations with unbounded documents.
 */
export function withMemo<T = AnyVal, R = AnyVal>(
  collection: RawObject[],
  expr: WindowOperatorInput,
  cacheFn: Callback<T>,
  fn: Callback<R, T>
) {
  // no caching done for bounded inputs
  if (!isUnbounded(expr.parentExpr.output[expr.field].window)) {
    return fn(cacheFn());
  }

  // first time using collection
  if (!memo.has(collection)) {
    memo.set(collection, { [expr.field]: cacheFn() });
  }
  const data = memo.get(collection) as RawObject;

  // subsequent computations over the same collection.
  if (data[expr.field] === undefined) {
    data[expr.field] = cacheFn();
  }
  let failed = false;
  try {
    return fn(data[expr.field] as T);
  } catch (e) {
    failed = true;
  } finally {
    // cleanup on failure or last element in collection.
    if (failed || expr.documentNumber === collection.length) {
      delete data[expr.field];
      if (Object.keys(data).length === 0) memo.delete(collection);
    }
  }
}

/** Returns the position of a document in the $setWindowFields stage partition. */
export function rank(
  _: RawObject,
  collection: RawObject[],
  expr: WindowOperatorInput,
  options: Options,
  dense: boolean
): AnyVal {
  return withMemo<{ values: RawArray; groups: GroupByOutput }, number>(
    collection,
    expr,
    () => {
      const sortKey = "$" + Object.keys(expr.parentExpr.sortBy)[0];
      const values = $push(collection, sortKey, options);
      const groups = groupBy(
        values,
        ((_: RawObject, n: number) => values[n]) as Callback,
        options.hashFunction
      );
      return { values, groups };
    },
    input => {
      const { values, groups: partitions } = input;
      // same number of paritions as length means all sort keys are unique
      if (partitions.size == collection.length) {
        return expr.documentNumber;
      }

      const current = values[expr.documentNumber - 1];

      let i = 0;
      let offset = 0;
      // partition keys are already dense so just return the value on match
      for (const key of partitions.keys()) {
        if (isEqual(current, key)) {
          return dense ? i + 1 : offset + 1;
        }
        i++;
        offset += partitions.get(key).length;
      }
      // should be unreachable
      throw new Error(
        "rank: invalid return value. please submit a bug report."
      );
    }
  );
}
