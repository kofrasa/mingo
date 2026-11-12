import { Any, AnyObject, Options } from "../../../types";
import { processExpression } from "../../_predicates";

/**
 * Matches values that are greater than a specified value.
 */
export const $gt = (obj: AnyObject, expr: Any, options: Options) =>
  processExpression(obj, expr, options, "$gt", n => n > 0);
