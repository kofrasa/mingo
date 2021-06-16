import { Options, redact } from "../../core";
import { Iterator } from "../../lazy";
import { RawObject } from "../../types";
import { cloneDeep } from "../../util";

/**
 * Restricts the contents of the documents based on information stored in the documents themselves.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/redact/
 */
export function $redact(
  collection: Iterator,
  expr: RawObject,
  options?: Options
): Iterator {
  return collection.map((obj) =>
    redact(cloneDeep(obj) as RawObject, expr, options)
  );
}
