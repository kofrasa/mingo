// $slice operator. https://docs.mongodb.com/manual/reference/operator/projection/slice/#proj._S_slice

import { Options } from "../../core";
import { AnyVal, RawArray, RawObject } from "../../types";
import { isArray, resolve } from "../../util";
import { $slice as __slice } from "../expression/array/slice";

/**
 * Limits the number of elements projected from an array. Supports skip and limit slices.
 *
 * @param obj
 * @param field
 * @param expr
 */
export function $slice(
  obj: RawObject,
  expr: AnyVal,
  field: string,
  options: Options
): AnyVal {
  const xs = resolve(obj, field);
  const exprAsArray = expr as RawArray;

  if (!isArray(xs)) return xs;

  return __slice(
    obj,
    expr instanceof Array ? [xs, ...exprAsArray] : [xs, expr],
    options
  );
}
