import { Any, Options } from "../../../types";
import { $regex as __regex, processQuery } from "../../_predicates";

/**
 * Selects documents where values match a specified regular expression.
 */
export const $regex = (selector: string, value: Any, options: Options) =>
  processQuery(selector, value, options, __regex);
