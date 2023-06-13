import { Options } from "../../core";
import { AnyVal, RawObject, WindowOperatorInput } from "../../types";
import { rank } from "./_internal";

/** Returns the document position relative to other documents in the $setWindowFields stage partition. */
export function $denseRank(
  obj: RawObject,
  collection: RawObject[],
  expr: WindowOperatorInput,
  options: Options
): AnyVal {
  return rank(obj, collection, expr, options, true /*dense*/);
}
