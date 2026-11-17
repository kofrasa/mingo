import { Any, AnyObject, Options } from "../../../types";
import { compareValues } from "./_internal";

/**
 * Matches values that are less than or equal to the value specified in the query.
 */
export const $lte = (obj: AnyObject, expr: Any, options: Options) =>
  compareValues(obj, expr, options, "$lte") <= 0;
