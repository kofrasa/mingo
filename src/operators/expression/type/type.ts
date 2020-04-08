/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { getType, MIN_INT, MAX_INT, JsType, BsonType } from '../../../util'
import { computeValue, Options } from '../../../core'


export function $type(obj: object, expr: any, options: Options): string {
  let val = computeValue(obj, expr, null, options)
  let typename = getType(val)
  let nativeType = typename.toLowerCase()
  switch (nativeType) {
    case JsType.BOOLEAN:
      return BsonType.BOOL
    case JsType.NUMBER:
      if (val.toString().indexOf('.') >= 0) return BsonType.DOUBLE
      return val >= MIN_INT && val <= MAX_INT ? BsonType.INT : BsonType.LONG
    case JsType.REGEXP:
      return BsonType.REGEX
    case JsType.STRING:
    case JsType.DATE:
    case JsType.ARRAY:
    case JsType.OBJECT:
    case JsType.FUNCTION:
    case JsType.NULL:
    case JsType.UNDEFINED:
      return nativeType
    default:
      // unrecognized custom type
      return typename
  }
}
