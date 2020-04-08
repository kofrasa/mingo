import { computeValue, Options } from "../../../core"
import { isString } from "../../../util"


export class TypeConvertError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export function toInteger(obj: object, expr: any, options: Options, max: number, min: number, typename: string): number | null {
  let val = computeValue(obj, expr, null, options)

  if (val === null || val === undefined) return null
  if (val instanceof Date) return val.getTime()

  let n = Math.trunc(Number(val))
  if (!isNaN(n) && n >= min && n <= max && (!isString(val) || /^\d+$/.test(val))) return n

  throw new TypeConvertError(`cannot convert '${val}' to ${typename}`)
}