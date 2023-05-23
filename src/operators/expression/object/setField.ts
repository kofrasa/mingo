// Object Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#object-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { assert, isNil, isObject, isString } from "../../../util";

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
export function $setField(
  obj: RawObject,
  expr: InputExpr,
  options: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as InputExpr;
  if (isNil(args.input)) return null;
  assert(
    isObject(args.input),
    "$setField expression 'input' must evaluate to an object"
  );
  assert(
    isString(args.field),
    "$setField expression 'field' must evaluate to a string"
  );
  if (expr.value == "$$REMOVE") {
    delete obj[args.field];
  } else {
    obj[args.field] = args.value;
  }

  return obj;
}
