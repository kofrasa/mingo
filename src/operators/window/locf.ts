import { ComputeOptions, computeValue, Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { WindowOperatorInput } from "../pipeline/_internal";

/**
 * Last observation carried forward. Sets values for null and missing fields in a window to the last non-null value for the field.
 */
export function $locf(
  obj: RawObject,
  collection: RawObject[],
  expr: WindowOperatorInput,
  options?: Options
): AnyVal {
  let lastObserved = computeValue(
    obj,
    expr.inputExpr,
    null,
    ComputeOptions.init(options, obj)
  );
  if (lastObserved === undefined && expr.documentNumber > 1) {
    const previous = collection[expr.documentNumber - 2];
    lastObserved = computeValue(
      previous,
      expr.inputExpr,
      null,
      ComputeOptions.init(options, previous)
    );
  }
  // TODO: consider using a temporary random field to store observations.
  obj[expr.field] = lastObserved;
  return lastObserved;
}
