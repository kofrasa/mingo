import { Any, AnyObject, Options } from "../../../types";
import { compareValues } from "./_internal";

/**
 * Matches values that are greater than or equal to a specified value.
 */
export const $gte = (obj: AnyObject, expr: Any, options: Options) =>
  compareValues(obj, expr, options, "$gte") >= 0;
