import { computeValue, Options } from "../../core";
import { Iterator, Lazy } from "../../lazy";
import { AnyVal, RawArray, RawObject } from "../../types";
import { assert, getType, into, isNil } from "../../util";

/**
 * Categorizes incoming documents into groups, called buckets, based on a specified expression and bucket boundaries.
 * https://docs.mongodb.com/manual/reference/operator/aggregation/bucket/
 *
 * @param {*} collection
 * @param {*} expr
 * @param {Options} opt Pipeline options
 */
export function $bucket(
  collection: Iterator,
  expr: {
    groupBy: AnyVal;
    boundaries: RawArray;
    default: AnyVal;
    output?: RawObject;
  },
  options?: Options
): Iterator {
  const boundaries = [...expr.boundaries];
  const defaultKey = expr.default as string;
  const lower = boundaries[0]; // inclusive
  const upper = boundaries[boundaries.length - 1]; // exclusive
  const outputExpr = expr.output || { count: { $sum: 1 } };

  assert(
    expr.boundaries.length > 2,
    "$bucket 'boundaries' expression must have at least 3 elements"
  );
  const boundType = getType(lower);

  for (let i = 0, len = boundaries.length - 1; i < len; i++) {
    assert(
      boundType === getType(boundaries[i + 1]),
      "$bucket 'boundaries' must all be of the same type"
    );
    assert(
      boundaries[i] < boundaries[i + 1],
      "$bucket 'boundaries' must be sorted in ascending order"
    );
  }

  !isNil(defaultKey) &&
    getType(expr.default) === getType(lower) &&
    assert(
      expr.default >= upper || expr.default < lower,
      "$bucket 'default' expression must be out of boundaries range"
    );

  const grouped: Record<string, RawArray> = {};
  for (const k of boundaries) {
    grouped[k as string] = [];
  }

  // add default key if provided
  if (!isNil(defaultKey)) grouped[defaultKey] = [];

  let iterator: Iterator = null;

  return Lazy(() => {
    if (iterator === null) {
      collection.each((obj: RawObject) => {
        const key = computeValue(obj, expr.groupBy, null, options);

        if (isNil(key) || key < lower || key >= upper) {
          assert(
            !isNil(defaultKey),
            "$bucket require a default for out of range values"
          );
          grouped[defaultKey].push(obj);
        } else {
          assert(
            key >= lower && key < upper,
            "$bucket 'groupBy' expression must resolve to a value in range of boundaries"
          );
          const index = findInsertIndex(boundaries, key);
          const boundKey = boundaries[Math.max(0, index - 1)] as string;
          grouped[boundKey].push(obj);
        }
      });

      // upper bound is exclusive so we remove it
      boundaries.pop();
      if (!isNil(defaultKey)) boundaries.push(defaultKey);

      iterator = Lazy(boundaries).map((key: string) => {
        const acc = computeValue(
          grouped[key],
          outputExpr,
          null,
          options
        ) as RawObject;
        return into(acc, { _id: key });
      });
    }

    return iterator.next();
  });
}

/**
 * Find the insert index for the given key in a sorted array.
 *
 * @param {*} sorted The sorted array to search
 * @param {*} item The search key
 */
function findInsertIndex(sorted: RawArray, item: AnyVal): number {
  // uses binary search
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = Math.round(lo + (hi - lo) / 2);
    if (item < sorted[mid]) {
      hi = mid - 1;
    } else if (item > sorted[mid]) {
      lo = mid + 1;
    } else {
      return mid;
    }
  }
  return lo;
}
