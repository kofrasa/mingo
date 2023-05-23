/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, BsonType, JsType, RawObject } from "../../../types";
import { getType, MAX_INT, MIN_INT } from "../../../util";

export function $type(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): BsonType {
  const val = computeValue(obj, expr, null, options) as number;
  const typename = getType(val);
  const nativeType = typename.toLowerCase() as JsType;
  switch (nativeType) {
    case "boolean":
      return "bool";
    case "number":
      if (val.toString().indexOf(".") >= 0) return "double";
      return val >= MIN_INT && val <= MAX_INT ? "int" : "long";
    case "regexp":
      return "regex";
    default:
      return nativeType as BsonType;
  }
}
