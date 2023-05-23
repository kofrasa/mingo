import { Options } from "../../core";
import { AnyVal, RawArray, RawObject } from "../../types";
import { isNil } from "../../util";
import { $push } from "../accumulator";
import { WindowOperatorInput } from "../pipeline/_internal";
import { withMemo } from "./_internal";

/**
 * Last observation carried forward. Sets values for null and missing fields in a window to the last non-null value for the field.
 */
export function $locf(
  _: RawObject,
  collection: RawObject[],
  expr: WindowOperatorInput,
  options: Options
): AnyVal {
  return withMemo(
    collection,
    expr,
    () => {
      const values = $push(collection, expr.inputExpr, options);
      for (let i = 1; i < values.length; i++) {
        if (isNil(values[i])) values[i] = values[i - 1];
      }
      return values;
    },
    (series: RawArray) => series[expr.documentNumber - 1]
  );
}
