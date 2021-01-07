import { Options } from "../../core";
import { Iterator } from "../../lazy";
import { ensureArray } from "../../util";
import { $project } from "./project";

/**
 * Removes/excludes fields from documents.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {Iterator}
 */
export function $unset(
  collection: Iterator,
  expr: string | string[],
  options?: Options
): Iterator {
  expr = ensureArray(expr) as string[];
  const doc: Record<string, number> = {};
  for (const k of expr) doc[k] = 0;
  return $project(collection, doc, options);
}
