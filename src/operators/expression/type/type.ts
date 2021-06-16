/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { BsonType, getType, JsType, MAX_INT, MIN_INT } from "../../../util";

export function $type(obj: RawObject, expr: AnyVal, options?: Options): string {
  const val = computeValue(obj, expr, null, options);
  const typename = getType(val);
  const nativeType = typename.toLowerCase();
  switch (nativeType) {
    case JsType.BOOLEAN:
      return BsonType.BOOL;
    case JsType.NUMBER:
      if (val.toString().indexOf(".") >= 0) return BsonType.DOUBLE;
      return val >= MIN_INT && val <= MAX_INT ? BsonType.INT : BsonType.LONG;
    case JsType.REGEXP:
      return BsonType.REGEX;
    case JsType.STRING:
    case JsType.DATE:
    case JsType.ARRAY:
    case JsType.OBJECT:
    case JsType.FUNCTION:
    case JsType.NULL:
    case JsType.UNDEFINED:
      return nativeType;
    default:
      // unrecognized custom type
      return typename;
  }
}
