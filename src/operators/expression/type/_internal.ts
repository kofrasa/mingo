import { computeValue, Options } from "../../../core"
import { isString, isNil, isNumber } from "../../../util"


export class TypeConvertError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export function toInteger(obj: object, expr: any, options: Options, max: number, min: number, typename: string): number | null {
  let val = computeValue(obj, expr, null, options)

  if (isNil(val)) return null
  if (val instanceof Date) return val.getTime()
  if (val === true) return 1
  if (val === false) return 0

  let n = Number(val)

  if (isNumber(n) && n >= min && n <= max) {
    // weirdly a decimal in string format cannot be converted to int.
    // so we must check input if not string or if it is, not in decimal format
    if (!isString(val) || n.toString().indexOf('.') === -1) {
      return Math.trunc(n)
    }
  }


  throw new TypeConvertError(`cannot convert '${val}' to ${typename}`)
}