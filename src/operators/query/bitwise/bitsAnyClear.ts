import { Any, Options } from "../../../types";
import { processBitwiseQuery } from "./_internal";

/**
 * Matches numeric or binary values in which any bit from a set of bit positions has a value of 0.
 */
export const $bitsAnyClear = (selector: string, value: Any, opts: Options) =>
  processBitwiseQuery(selector, value, opts, (result, mask) => result < mask);
