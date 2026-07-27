import { Any, Options } from "../../../types";
import { $type as __type, processQuery } from "../../_predicates";

/**
 * Selects documents if a field is of the specified type.
 */
export const $type = (selector: string, value: Any, options: Options) =>
  processQuery(selector, value, options, __type);
