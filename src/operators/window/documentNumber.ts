import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { WindowOperatorInput } from "../pipeline/_internal";

/** Returns the position of a document in the $setWindowFields stage partition. */
export function $documentNumber(
  obj: RawObject,
  collection: RawObject[],
  expr: WindowOperatorInput,
  options: Options
): AnyVal {
  return expr.documentNumber;
}
