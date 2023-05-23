// Object Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#object-expression-operators

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { $setField } from "./setField";

interface InputExpr {
  readonly field: string;
  readonly input: RawObject;
  readonly value: AnyVal;
}

/**
 * Adds, updates, or removes a specified field in a document.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
export function $unsetField(
  obj: RawObject,
  expr: InputExpr,
  options: Options
): AnyVal {
  return $setField(
    obj,
    {
      ...expr,
      value: "$$REMOVE"
    },
    options
  );
}
