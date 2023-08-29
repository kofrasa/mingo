// Miscellaneous Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/rand/#mongodb-expression-exp.-rand

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { assert, isNil, isObject, isString } from "../../../util";

interface InputExpr {
  readonly field: string;
  readonly input?: RawObject;
}

/**
 * Adds, updates, or removes a specified field in a document.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
export const $getField: ExpressionOperator = (
  obj: RawObject,
  expr: InputExpr | string,
  options: Options
): AnyVal => {
  const args = computeValue(obj, expr, null, options) as InputExpr | string;
  const [field, input] = isObject(args)
    ? [args.field, args.input || obj]
    : [args, obj];

  if (isNil(input)) return null;

  assert(
    isObject(input),
    "$getField expression 'input' must evaluate to an object"
  );
  assert(
    isString(field),
    "$getField expression 'field' must evaluate to a string"
  );

  return input[field];
};
