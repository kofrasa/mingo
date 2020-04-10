/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { JsType, BsonType, isNil } from '../../../util'
import { computeValue, Options } from '../../../core'
import { $toString } from './toString'
import { $toBool } from './toBool'
import { $toDate } from './toDate'
import { $toDouble } from './toDouble'
import { $toInt } from './toInt'
import { $toLong } from './toLong'
import { TypeConvertError } from './_internal'

/**
 * Converts a value to a specified type.
 *
 * @param obj
 * @param expr
 */
export function $convert(obj: object, expr: any, options: Options): any {
  let args: {
    input: any
    to: string | number
    onError?: any
    onNull?: any
  } = computeValue(obj, expr, null, options)

  args.onNull = args.onNull === undefined ? null : args.onNull

  if (isNil(args.input)) return args.onNull

  try {
    switch (args.to) {
      case 2:
      case JsType.STRING:
        return $toString(obj, args.input, options)

      case 8:
      case JsType.BOOLEAN:
      case BsonType.BOOL:
        return $toBool(obj, args.input, options)

      case 9:
      case JsType.DATE:
        return $toDate(obj, args.input, options)

      case 1:
      case 19:
      case BsonType.DOUBLE:
      case BsonType.DECIMAL:
      case JsType.NUMBER:
        return $toDouble(obj, args.input, options)

      case 16:
      case BsonType.INT:
        return $toInt(obj, args.input, options)

      case 18:
      case BsonType.LONG:
        return $toLong(obj, args.input, options)
    }
  } catch (e) { }

  if (args.onError !== undefined) return args.onError

  throw new TypeConvertError(`could not convert to type ${args.to}.`)
}
