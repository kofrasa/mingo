import { Any, AnyObject, Options } from "../../../types";
import { compareValues, EQ_CMP } from "./_internal";

/**
 * Matches all values that are not equal to the value specified in the query.
 */
export const $ne = (obj: AnyObject, expr: Any, options: Options) =>
  compareValues(obj, expr, options, "$ne", EQ_CMP) !== 0;
