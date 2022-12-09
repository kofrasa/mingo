import { ComputeOptions, computeValue, Options } from "../../core";
import { Iterator } from "../../lazy";
import { RawArray, RawObject } from "../../types";
import { groupBy } from "../../util";

// lookup key for grouping
const ID_KEY = "_id";

/**
 * Groups documents together for the purpose of calculating aggregate values based on a collection of documents.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {Array}
 */
export function $group(
  collection: Iterator,
  expr: RawObject,
  options?: Options
): Iterator {
  const idExpr = expr[ID_KEY];
  const copts = ComputeOptions.init(options);

  return collection.transform((coll: RawArray) => {
    const partitions = groupBy(
      coll,
      (obj) => computeValue(obj, idExpr, null, options),
      options?.hashFunction
    );

    // remove the group key
    expr = { ...expr } as RawObject;
    delete expr[ID_KEY];

    let i = -1;
    const size = partitions.keys.length;

    return () => {
      if (++i === size) return { done: true };

      const groupId = partitions.keys[i];
      const obj: RawObject = {};

      // exclude undefined key value
      if (groupId !== undefined) {
        obj[ID_KEY] = groupId;
      }

      // compute remaining keys in expression
      for (const [key, val] of Object.entries(expr)) {
        obj[key] = computeValue(
          partitions.groups[i],
          val,
          key,
          copts.udpate(null, { groupId })
        );
      }

      return { value: obj, done: false };
    };
  });
}
