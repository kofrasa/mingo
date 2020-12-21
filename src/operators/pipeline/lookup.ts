import { Options } from "../../core";
import { Iterator } from "../../lazy";
import {
  assert,
  Collection,
  each,
  hashCode,
  into,
  isArray,
  isString,
  RawArray,
  RawObject,
  resolve,
} from "../../util";

/**
 * Performs a left outer join to another collection in the same database to filter in documents from the “joined” collection for processing.
 *
 * @param collection
 * @param expr
 * @param opt
 */
export function $lookup(
  collection: Iterator,
  expr: RawObject,
  options?: Options
): Iterator {
  const joinColl = expr.from as Collection;
  const localField = expr.localField as string;
  const foreignField = expr.foreignField as string;
  const asField = expr.as as string;

  assert(
    isArray(joinColl) &&
      isString(foreignField) &&
      isString(localField) &&
      isString(asField),
    "$lookup: invalid argument"
  );

  const hash: Record<string, RawArray> = {};

  each(joinColl, (obj: RawObject) => {
    const k = hashCode(resolve(obj, foreignField), options?.hashFunction);
    hash[k] = hash[k] || [];
    hash[k].push(obj);
  });

  return collection.map((obj: RawObject) => {
    const k = hashCode(resolve(obj, localField), options?.hashFunction);
    const newObj = into({}, obj);
    newObj[asField] = hash[k] || [];
    return newObj;
  });
}
