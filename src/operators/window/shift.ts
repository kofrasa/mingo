import { computeValue, Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { WindowOperatorInput } from "../pipeline/_internal";

/**
 * Returns the value from an expression applied to a document in a specified
 * position relative to the current document in the $setWindowFields stage partition.
 */
export function $shift(
  obj: RawObject,
  collection: RawObject[],
  expr: WindowOperatorInput,
  options: Options
): AnyVal {
  const input = expr.inputExpr as {
    output: AnyVal;
    by: number;
    default?: AnyVal;
  };

  const shiftedIndex = expr.documentNumber - 1 + input.by;
  if (shiftedIndex < 0 || shiftedIndex > collection.length - 1) {
    return input.default
      ? computeValue(obj, input.default, null, options)
      : null;
  }
  return computeValue(collection[shiftedIndex], input.output, null, options);
}
