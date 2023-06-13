import { Options } from "../../core";
import { AnyVal, RawObject, WindowOperatorInput } from "../../types";

/** Returns the position of a document in the $setWindowFields stage partition. */
export function $documentNumber(
  obj: RawObject,
  collection: RawObject[],
  expr: WindowOperatorInput,
  options: Options
): AnyVal {
  return expr.documentNumber;
}
