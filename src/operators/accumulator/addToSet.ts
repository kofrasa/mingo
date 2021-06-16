import { Options } from "../../core";
import { AnyVal, Collection } from "../../types";
import { unique } from "../../util";
import { $push } from "./push";

/**
 * Returns an array of all the unique values for the selected field among for each document in that group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
export function $addToSet(
  collection: Collection,
  expr: AnyVal,
  options?: Options
): Collection {
  return unique(
    $push(collection, expr, options),
    options?.hashFunction
  ) as Collection;
}
