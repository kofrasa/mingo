import { Any, Options } from "../../../types";
import { $size as __size, processQuery } from "../../_predicates";

/**
 * Selects documents if the array field is a specified size.
 */
export const $size = (selector: string, value: Any, options: Options) =>
  processQuery(selector, value, options, __size);
