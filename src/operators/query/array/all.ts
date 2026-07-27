import { Any, Options } from "../../../types";
import { $all as __all, processQuery } from "../../_predicates";

/**
 * Matches arrays that contain all elements specified in the query.
 */
export const $all = (selector: string, value: Any, options: Options) =>
  processQuery(selector, value, options, __all);
