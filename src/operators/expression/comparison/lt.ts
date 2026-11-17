import { Any, AnyObject, Options } from "../../../types";
import { compareValues } from "./_internal";

/**
 * Matches values that are less than the value specified in the query.
 */
export const $lt = (obj: AnyObject, expr: Any, options: Options) =>
  compareValues(obj, expr, options, "$lt") === -1;
