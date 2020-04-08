// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { computeValue, Options } from '../../../core'
import { isNil, isObject } from '../../../util'
import { DATE_FORMAT, DATE_SYM_TABLE, regexQuote, regexStrip, parseTimezone, adjustDate } from './_internal'

/**
 * Converts a date/time string to a date object.
 * @param obj
 * @param expr
 */
export function $dateFromString(obj: object, expr: any, options: Options): any {
  let args: {
    dateString?: string
    timezone?: string
    format?: string
    onError?: any
    onNull?: any
  } = computeValue(obj, expr, null, options)

  args.format = args.format || DATE_FORMAT
  args.onNull = args.onNull || null

  let dateString = args.dateString
  if (isNil(dateString)) return args.onNull

  // collect all separators of the format string
  let separators = args.format.split(/%[YGmdHMSLuVzZ]/)
  separators.reverse()

  let matches = args.format.match(/(%%|%Y|%G|%m|%d|%H|%M|%S|%L|%u|%V|%z|%Z)/g)

  let dateParts: {
    year?: number
    month?: number
    day?: number
    hour?: number
    minute?: number
    second?: number
    millisecond?: number
    timezone?: string
    minuteOffset?: string
  } = {}

  // holds the valid regex of parts that matches input date string
  let expectedPattern = ''

  for (let i = 0, len = matches.length; i < len; i++) {
    let formatSpecifier = matches[i]
    let props = DATE_SYM_TABLE[formatSpecifier]

    if (isObject(props)) {
      // get pattern and alias from table
      let m = dateString.match(props.re)

      // get the next separtor
      let delimiter = separators.pop() || ''

      if (m !== null) {
        // store and cut out matched part
        dateParts[props.name] = m[0].match(/^\d+$/) ? parseInt(m[0]) : m[0]
        dateString = dateString.substr(0, m.index) + dateString.substr(m.index + m[0].length)

        // construct expected pattern
        expectedPattern += (regexQuote(delimiter) + regexStrip(props.re.toString()))
      } else {
        dateParts[props.name] = null
      }
    }
  }

  // 1. validate all required date parts exists
  // 2. validate original dateString against expected pattern.
  if (dateParts.year === null
    || dateParts.month === null
    || dateParts.day === null
    || !args.dateString.match(new RegExp('^' + expectedPattern + '$'))) return args.onError

  let tz = parseTimezone(args.timezone)

  // create the date. month is 0-based in Date
  let d = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, 0, 0, 0))

  if (dateParts.hour !== null) d.setUTCHours(dateParts.hour)
  if (dateParts.minute !== null) d.setUTCMinutes(dateParts.minute)
  if (dateParts.second !== null) d.setUTCSeconds(dateParts.second)
  if (dateParts.millisecond !== null) d.setUTCMilliseconds(dateParts.millisecond)

  // The minute part is unused when converting string.
  // This was observed in the tests on MongoDB site but not officially stated anywhere
  tz.minute = 0
  adjustDate(d, tz)

  return d
}