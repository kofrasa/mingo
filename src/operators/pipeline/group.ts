import { computeValue, Options } from "../../core";
import { Iterator } from "../../lazy";
import { RawArray, RawObject } from "../../types";
import { groupBy, into } from "../../util";

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
  // lookup key for grouping
  const ID_KEY = "_id";

  const id = expr[ID_KEY];

  return collection.transform((coll: RawArray) => {
    const partitions = groupBy(
      coll,
      (obj) => computeValue(obj, id, null, options),
      options?.hashFunction
    );

    // remove the group key
    expr = into({}, expr) as RawObject;
    delete expr[ID_KEY];

    let i = -1;
    const size = partitions.keys.length;

    return () => {
      if (++i === size) return { done: true };

      const value = partitions.keys[i];
      const obj: RawObject = {};

      // exclude undefined key value
      if (value !== undefined) {
        obj[ID_KEY] = value;
      }

      // compute remaining keys in expression
      for (const [key, val] of Object.entries(expr)) {
        obj[key] = computeValue(partitions.groups[i], val, key, options);
      }

      return { value: obj, done: false };
    };
  });
}
