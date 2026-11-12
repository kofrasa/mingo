import { Any, AnyObject, Options } from "../../../types";
import { processExpression } from "../../_predicates";

/**
 * Matches values that are greater than or equal to a specified value.
 */
export const $gte = (obj: AnyObject, expr: Any, options: Options) =>
  processExpression(obj, expr, options, "$gte", n => n >= 0);
