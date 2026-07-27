import { Any, Options } from "../../../types";
import { processBitwiseQuery } from "./_internal";

/**
 * Matches numeric or binary values in which a set of bit positions all have a value of 1.
 */
export const $bitsAllSet = (selector: string, value: Any, opts: Options) =>
  processBitwiseQuery(selector, value, opts, (result, mask) => result == mask);
