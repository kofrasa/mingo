import { Any, AnyObject, Options } from "../../../types";
import { compareValues } from "./_internal";

/**
 * Compares two values and returns the result of the comparison as an integer.
 */
export const $cmp = (obj: AnyObject, expr: Any, options: Options): Any =>
  compareValues(obj, expr, options, "$cmp");
