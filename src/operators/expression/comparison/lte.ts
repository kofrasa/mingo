import { Any, AnyObject, Options } from "../../../types";
import { processExpression } from "../../_predicates";

/**
 * Matches values that are less than or equal to the value specified in the query.
 */
export const $lte = (obj: AnyObject, expr: Any, options: Options) =>
  processExpression(obj, expr, options, "$lte", n => n <= 0);
