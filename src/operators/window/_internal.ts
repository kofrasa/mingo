import { Options } from "../../core";
import { AnyVal, RawArray, RawObject } from "../../types";
import { assert, groupBy, hashCode, isEqual, isOperator } from "../../util";
import { $push } from "../accumulator";
import { WindowOperatorInput } from "../pipeline/_internal";

type CacheValue = {
  partitions: { keys: RawArray; groups: RawArray[] };
  sortValues: RawArray;
  lastRank: number;
  groupIndex: number;
};

const cache: Record<string, CacheValue> = {};

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
    if (obj[expr.indexKey] === 0) {
      const sortValues = $push(collection, sortKey, options);
      const partitions = groupBy(
        collection,
        (_: RawObject, n: number) => sortValues[n],
        options.hashFunction
      );

      // cache the data for subsequent runs
      cache[key] = {
        partitions,
        sortValues,
        lastRank: 1,
        groupIndex: 0,
      };
    }

    const { partitions, sortValues, groupIndex, lastRank } = cache[key];

    const currentIndex = obj[expr.indexKey] as number;

    // same number of paritions as lenght means all sort keys are unique
    if (partitions.keys.length == collection.length) {
      return currentIndex + 1;
    }

    let rank = lastRank;
    const current = sortValues[currentIndex];

    for (let i = groupIndex; i < partitions.keys.length; i++) {
      if (isEqual(current, partitions.keys[i])) {
        cache[key].groupIndex = i;
        cache[key].lastRank = dense ? i : rank;
        return cache[key].lastRank;
      }
      rank += partitions.groups[i].length;
    }
  } finally {
    if (obj[expr.indexKey] == collection.length - 1) {
      delete cache[key];
    }
  }
}
