import { Any, AnyObject, Options } from "../../../types";
import { compareValues } from "./_internal";

/**
 * Matches values that are greater than a specified value.
 */
export const $gt = (obj: AnyObject, expr: Any, options: Options) =>
  compareValues(obj, expr, options, "$gt") === 1;
