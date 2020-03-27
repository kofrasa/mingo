import { isString, jsType } from '../../util'
import { computeValue } from '../../internal'
import { $dateToString } from './date'
import { T_BOOLEAN, T_BOOL, T_NUMBER, T_REGEXP, T_REGEX, MIN_INT, MAX_INT, MAX_LONG, MIN_LONG } from '../../constants'

class TypeConvertError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export function $type(obj: object, expr: any): string {
  let val = computeValue(obj, expr)
  let typename = jsType(val)
  switch (typename) {
    case T_BOOLEAN:
      return T_BOOL
    case T_NUMBER:
      if (val.toString().indexOf('.') >= 0) return 'double'
      return val >= MIN_INT && val <= MAX_INT ? 'int' : 'long'
    case T_REGEXP:
      return T_REGEX
    default:
      return typename
  }
}

/**
 * Converts a value to a boolean.
 *
 * @param obj
 * @param expr
 */
export function $toBool(obj: object, expr: any): boolean | null {
  let val = computeValue(obj, expr)
  if (val === null || val === undefined) return null
  return Boolean(val)
}

export function $toString(obj: object, expr: any): string | null {
  let val = computeValue(obj, expr)
  if (val === null || val === undefined) return null
  if (val instanceof Date) {
    let dateExpr = {
      date: expr,
      format: "%Y-%m-%dT%H:%M:%S.%LZ"
    }
    return $dateToString(obj, dateExpr)
  } else {
    return val.toString()
  }
}

export function toInteger(obj: object, expr: any, max: number, min: number, typename: string): number | null {
  let val = computeValue(obj, expr)

  if (val === null || val === undefined) return null
  if (val instanceof Date) return val.getTime()

  let n = Math.trunc(Number(val))
  if (!isNaN(n) && n >= min && n <= max && (!isString(val) || /^\d+$/.test(val))) return n

  throw new TypeConvertError(`cannot convert '${val}' to ${typename}`)
}

/**
 * Converts a value to an integer. If the value cannot be converted to an integer, $toInt errors. If the value is null or missing, $toInt returns null.
 * @param obj
 * @param expr
 */
export function $toInt(obj: object, expr: any): number | null {
  return toInteger(obj, expr, MAX_INT, MIN_INT, 'int')
}

/**
 * Converts a value to a long. If the value cannot be converted to a long, $toLong errors. If the value is null or missing, $toLong returns null.
 */
export function $toLong(obj: object, expr: any): number | null {
  return toInteger(obj, expr, MAX_LONG, MIN_LONG, 'long')
}

/**
 * Converts a value to a double. If the value cannot be converted to an double, $toDouble errors. If the value is null or missing, $toDouble returns null.
 *
 * @param obj
 * @param expr
 */
export function $toDouble(obj: object, expr: any): number | null {
  let val = computeValue(obj, expr)

  if (val === null || val === undefined) return null
  if (val instanceof Date) return val.getTime()
  let n = Number(val)
  if (!isNaN(n) && n.toString() === val.toString()) return n
  throw new TypeConvertError(`cannot convert '${val}' to double/decimal`)
}

/**
 * Converts a value to a decimal. If the value cannot be converted to a decimal, $toDecimal errors. If the value is null or missing, $toDecimal returns null.
 * Alias for $toDouble in Mingo.
 */
export const $toDecimal = $toDouble

/**
 * Converts a value to a date. If the value cannot be converted to a date, $toDate errors. If the value is null or missing, $toDate returns null.
 *
 * @param obj
 * @param expr
 */
export function $toDate(obj: object, expr: any): Date | null {
  let val = computeValue(obj, expr)

  if (val instanceof Date) return val
  if (val === null || val === undefined) return null

  let d = new Date(val)
  let n = d.getTime()
  if (!isNaN(n)) return d

  throw new TypeConvertError(`cannot convert '${val}' to date`)
}

const PARAMS__CONVERT = ['input', 'to', 'onError', 'onNull']

/**
 * Converts a value to a specified type.
 *
 * @param obj
 * @param expr
 */
export function $convert(obj: object, expr: any): any {
  let ctx: {
    input: any
    to: string | number
    onError?: any
    onNull?: any
  } = Object.create({})

  PARAMS__CONVERT.forEach((k: string) => {
    ctx[k] = computeValue(obj, expr[k])
  })

  ctx.onNull = ctx.onNull === undefined ? null : ctx.onNull

  if (ctx.input === null || ctx.input === undefined) return ctx.onNull

  try {
    switch (ctx.to) {
      case 2:
      case 'string':
        return $toString(obj, ctx.input)

      case 8:
      case 'bool':
        return $toBool(obj, ctx.input)

      case 9:
      case 'date':
        return $toDate(obj, ctx.input)

      case 1:
      case 19:
      case 'double':
      case 'decimal':
        return $toDouble(obj, ctx.input)

      case 16:
      case 'int':
        return $toInt(obj, ctx.input)

      case 18:
      case 'long':
        return $toLong(obj, ctx.input)
    }
  } catch (e) {}

  if (ctx.onError !== undefined) return ctx.onError

  throw new TypeConvertError(`failed to convert ${ctx.input} to ${ctx.to}`)
}
