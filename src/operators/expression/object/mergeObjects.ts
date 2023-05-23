// Object Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#object-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { into } from "../../../util";

/**
 * Combines multiple documents into a single document.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
export function $mergeObjects(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  const docs = computeValue(obj, expr, null, options) as RawObject[];
  return docs instanceof Array
    ? docs.reduce((memo, o) => into(memo, o), {})
    : {};
}
