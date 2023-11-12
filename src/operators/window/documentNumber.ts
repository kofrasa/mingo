import { Options } from "../../core";
import { AnyVal, RawObject, WindowOperatorInput } from "../../types";

/** Returns the position of a document in the $setWindowFields stage partition. */
export function $documentNumber(
  _obj: RawObject,
  _collection: RawObject[],
  expr: WindowOperatorInput,
  _options: Options
): AnyVal {
  return expr.documentNumber;
}
