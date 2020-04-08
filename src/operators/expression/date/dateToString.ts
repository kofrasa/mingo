// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { computeValue, Options } from '../../../core'
import { isNil, isArray, isObject } from '../../../util'
import {
  MINUTES_PER_HOUR,
  DATE_FORMAT,
  DATE_SYM_TABLE,
  formatTimezone,
  computeDate,
  parseTimezone,
  adjustDate,
  padDigits
} from './common'
import { $year } from './year'
import { $month } from './month'
import { $dayOfMonth } from './dayOfMonth'
import { $dayOfWeek } from './dayOfWeek'
import { $hour } from './hour'
import { $minute } from './minute'
import { $second } from './second'
import { $millisecond } from './millisecond'
import { $week } from './week'


// date functions for format specifiers
const DATE_FUNCTIONS = {
  '%Y': $year,
  '%G': $year,
  '%m': $month,
  '%d': $dayOfMonth,
  '%H': $hour,
  '%M': $minute,
  '%S': $second,
  '%L': $millisecond,
  '%u': $dayOfWeek,
  '%V': $week,
  '%z': null,
  '%Z': null,
  '%%': '%'
}

/**
 * Returns the date as a formatted string.
 *
 * %d	Day of Month (2 digits, zero padded)	01-31
 * %G	Year in ISO 8601 format	0000-9999
 * %H	Hour (2 digits, zero padded, 24-hour clock)	00-23
 * %L	Millisecond (3 digits, zero padded)	000-999
 * %m	Month (2 digits, zero padded)	01-12
 * %M	Minute (2 digits, zero padded)	00-59
 * %S	Second (2 digits, zero padded)	00-60
 * %u	Day of week number in ISO 8601 format (1-Monday, 7-Sunday)	1-7
 * %V	Week of Year in ISO 8601 format	1-53
 * %Y	Year (4 digits, zero padded)	0000-9999
 * %z	The timezone offset from UTC.	+/-[hh][mm]
 * %Z	The minutes offset from UTC as a number. For example, if the timezone offset (+/-[hhmm]) was +0445, the minutes offset is +285.	+/-mmm
 * %%	Percent Character as a Literal	%
 *
 * @param obj current object
 * @param expr operator expression
 */
export function $dateToString(obj: object, expr: any, options: Options): string {
  let args: {
    date?: Date
    format?: string
    timezone?: any
    onNull: any
  } = computeValue(obj, expr, null, options)

  if (isNil(args.onNull)) args.onNull = null
  if (isNil(args.date)) return args.onNull

  let date = computeDate(obj, args.date, options)
  let format = args.format || DATE_FORMAT
  let tz = parseTimezone(args.timezone)
  let matches = format.match(/(%%|%Y|%G|%m|%d|%H|%M|%S|%L|%u|%V|%z|%Z)/g)

  // adjust the date to reflect timezone
  adjustDate(date, tz)

  for (let i = 0, len = matches.length; i < len; i++) {
    let formatSpecifier = matches[i]
    let props = DATE_SYM_TABLE[formatSpecifier]
    let operatorFn = DATE_FUNCTIONS[formatSpecifier]
    let value: string

    if (isObject(props)) {
      // reuse date
      if (props.name === 'timezone') {
        value = formatTimezone(tz)
      } else if (props.name === 'minuteOffset') {
        value = `${(tz.hour < 0 ? -1 : 1) * Math.abs(tz.hour * MINUTES_PER_HOUR) + tz.minute}`
      } else if (operatorFn != null) {
        value = padDigits(operatorFn(obj, date, options), props.padding)
      } else {
        value = props
      }
    } else {
      value = props
    }
    // replace the match with resolved value
    format = format.replace(formatSpecifier, value)
  }

  return format
}