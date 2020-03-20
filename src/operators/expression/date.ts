
import { isArray } from '../../util'
import { computeValue } from '../../internal'

const ONE_DAY_MILLIS = 1000 * 60 * 60 * 24

/**
 * Returns the day of the year for a date as a number between 1 and 366 (leap year).
 * @param obj
 * @param expr
 */
export function $dayOfYear(obj: object, expr: any): any {
  let d = computeValue(obj, expr) as Date
  let start = new Date(d.getFullYear(), 0, 0)
  let diff = d.getTime() - start.getTime()
  return Math.round(diff / ONE_DAY_MILLIS)
}

/**
 * Returns the day of the month for a date as a number between 1 and 31.
 * @param obj
 * @param expr
 */
export function $dayOfMonth(obj: object, expr: any): any {
  let d = computeValue(obj, expr)
  return d.getDate()
}

/**
 * Returns the day of the week for a date as a number between 1 (Sunday) and 7 (Saturday).
 * @param obj
 * @param expr
 */
export function $dayOfWeek(obj: object, expr: any): any {
  let d = computeValue(obj, expr)
  return d.getDay() + 1
}

/**
 * Returns the year for a date as a number (e.g. 2014).
 * @param obj
 * @param expr
 */
export function $year(obj: object, expr: any): any {
  let d = computeValue(obj, expr)
  return d.getFullYear()
}

/**
 * Returns the month for a date as a number between 1 (January) and 12 (December).
 * @param obj
 * @param expr
 */
export function $month(obj: object, expr: any): any {
  let d = computeValue(obj, expr)
  return d.getMonth() + 1
}

/**
 * Returns the week number for a date as a number between 0
 * (the partial week that precedes the first Sunday of the year) and 53 (leap year).
 * @param obj
 * @param expr
 */
export function $week(obj: object, expr: any): any {
  // source: http://stackoverflow.com/a/6117889/1370481
  let d = computeValue(obj, expr)

  // Copy date so don't modify original
  d = new Date(+d)
  d.setHours(0, 0, 0)
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  // Get first day of year
  let yearStart = new Date(d.getFullYear(), 0, 1)
  // Calculate full weeks to nearest Thursday
  return Math.floor((((d.getTime() - yearStart.getTime()) / 8.64e7) + 1) / 7)
}

/**
 * Returns the hour for a date as a number between 0 and 23.
 * @param obj
 * @param expr
 */
export function $hour(obj: object, expr: any): any {
  let d = computeValue(obj, expr)
  return d.getUTCHours()
}

/**
 * Returns the minute for a date as a number between 0 and 59.
 * @param obj
 * @param expr
 */
export function $minute(obj: object, expr: any): any {
  let d = computeValue(obj, expr)
  return d.getMinutes()
}

/**
 * Returns the seconds for a date as a number between 0 and 60 (leap seconds).
 * @param obj
 * @param expr
 */
export function $second(obj: object, expr: any): any {
  let d = computeValue(obj, expr)
  return d.getSeconds()
}

/**
 * Returns the milliseconds of a date as a number between 0 and 999.
 * @param obj
 * @param expr
 */
export function $millisecond(obj: object, expr: any): any {
  let d = computeValue(obj, expr)
  return d.getMilliseconds()
}

// used for formatting dates in $dateToString operator
const DATE_SYM_TABLE = {
  '%Y': [$year, 4],
  '%m': [$month, 2],
  '%d': [$dayOfMonth, 2],
  '%H': [$hour, 2],
  '%M': [$minute, 2],
  '%S': [$second, 2],
  '%L': [$millisecond, 3],
  '%j': [$dayOfYear, 3],
  '%w': [$dayOfWeek, 1],
  '%U': [$week, 2],
  '%%': '%'
}

/**
 * Returns the date as a formatted string.
 *
 * %Y  Year (4 digits, zero padded)  0000-9999
 * %m  Month (2 digits, zero padded)  01-12
 * %d  Day of Month (2 digits, zero padded)  01-31
 * %H  Hour (2 digits, zero padded, 24-hour clock)  00-23
 * %M  Minute (2 digits, zero padded)  00-59
 * %S  Second (2 digits, zero padded)  00-60
 * %L  Millisecond (3 digits, zero padded)  000-999
 * %j  Day of year (3 digits, zero padded)  001-366
 * %w  Day of week (1-Sunday, 7-Saturday)  1-7
 * %U  Week of year (2 digits, zero padded)  00-53
 * %%  Percent Character as a Literal  %
 *
 * @param obj current object
 * @param expr operator expression
 */
export function $dateToString(obj: object, expr: any): any {
  let fmt = expr['format']
  let date = computeValue(obj, expr['date'])
  let matches = fmt.match(/(%%|%Y|%m|%d|%H|%M|%S|%L|%j|%w|%U)/g)

  for (let i = 0, len = matches.length; i < len; i++) {
    let hdlr = DATE_SYM_TABLE[matches[i]]
    let value = hdlr

    if (isArray(hdlr)) {
      // reuse date operators
      let fn = hdlr[0]
      let pad = hdlr[1]
      value = padDigits(fn(obj, date), pad)
    }
    // replace the match with resolved value
    fmt = fmt.replace(matches[i], value)
  }

  return fmt
}

function padDigits(number, digits) {
  return new Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number
}
