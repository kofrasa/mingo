import { Any, AnyObject, Options } from "../../../types";
import { compareValues, EQ_CMP } from "./_internal";

/**
 * Matches values that are equal to a specified value.
 */
export const $eq = (obj: AnyObject, expr: Any, options: Options) =>
  compareValues(obj, expr, options, "$eq", EQ_CMP) === 0;
