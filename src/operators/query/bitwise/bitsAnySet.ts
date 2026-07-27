import { Any, Options } from "../../../types";
import { processBitwiseQuery } from "./_internal";

/**
 * Matches numeric or binary values in which any bit from a set of bit positions has a value of 1.
 */
export const $bitsAnySet = (selector: string, value: Any, opts: Options) =>
  processBitwiseQuery(selector, value, opts, (result, _) => result > 0);
