/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { assert, isNil, isString } from "../../../util";

/**
 * Replaces all instances of a matched string in a given input.
 *
 * @param  {Object} obj
 * @param  {Array} expr
 */
export function $replaceAll(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as {
    input: string;
    find: string;
    replacement: string;
  };
  const arr = [args.input, args.find, args.replacement];
  if (arr.some(isNil)) return null;
  assert(
    arr.every(isString),
    "$replaceAll expression fields must evaluate to string"
  );
  return args.input.replace(new RegExp(args.find, "g"), args.replacement);
}
