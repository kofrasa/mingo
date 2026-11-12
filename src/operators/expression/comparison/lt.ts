import { Any, AnyObject, Options } from "../../../types";
import { processExpression } from "../../_predicates";

/**
 * Matches values that are less than the value specified in the query.
 */
export const $lt = (obj: AnyObject, expr: Any, options: Options) =>
  processExpression(obj, expr, options, "$lt", n => n < 0);
