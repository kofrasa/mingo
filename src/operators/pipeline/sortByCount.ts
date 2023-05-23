import { Options } from "../../core";
import { Iterator } from "../../lazy";
import { AnyVal, RawObject } from "../../types";
import { $group } from "./group";
import { $sort } from "./sort";

/**
 * Groups incoming documents based on the value of a specified expression,
 * then computes the count of documents in each distinct group.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/sortByCount/
 *
 * @param  {Array} collection
 * @param  {Object} expr
 * @param  {Object} options
 * @return {*}
 */
export function $sortByCount(
  collection: Iterator,
  expr: AnyVal,
  options: Options
): Iterator {
  const newExpr: RawObject = { count: { $sum: 1 } };

  newExpr["_id"] = expr;

  return $sort($group(collection, newExpr, options), { count: -1 }, options);
}
