import { Any, Options } from "../../../types";
import { processBitwiseQuery } from "./_internal";

/**
 * Matches numeric or binary values in which a set of bit positions all have a value of 0.
 */
export const $bitsAllClear = (selector: string, value: Any, opts: Options) =>
  processBitwiseQuery(selector, value, opts, (result, _) => result == 0);
