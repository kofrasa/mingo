import { Any, AnyObject, Options } from "../../../types";
import { processExpression } from "../../_predicates";

/**
 * Matches all values that are not equal to the value specified in the query.
 */
export const $ne = (obj: AnyObject, expr: Any, options: Options) =>
  processExpression(obj, expr, options, "$ne", n => n !== 0);
