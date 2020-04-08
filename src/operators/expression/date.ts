// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { computeValue, Options } from '../../core'
import { isNil, isArray, isObject, isString, isDate, has } from '../../util'

const ONE_DAY_MILLIS = 1000 * 60 * 60 * 24
const MINUTES_PER_HOUR = 60

// default format if unspecified
const DATE_FORMAT = "%Y-%m-%dT%H:%M:%S.%LZ"

interface Timezone {
  hour: number
  minute: number
}

/**
 * Parse and return the timezone string as a number
 * @param tzstr Timezone string matching '+/-hh[:][mm]'
 */
function parseTimezone(tzstr?: string): Timezone {
  if (isNil(tzstr)) return { hour: 0, minute: 0 }

  let re = DATE_SYM_TABLE['%z'][3] as RegExp
  let m = tzstr.match(re)
  if (!m) throw Error(`invalid or location-based timezone '${tzstr}' not supported`)

  return {
    hour:  parseInt(m[2]) || 0,
    minute: parseInt(m[3]) || 0
  }
}

/**
 * Formats the timezone for output
 * @param tz A timezone object
 */
function formatTimezone(tz: Timezone): string {
  return (tz.hour < 0 ? "-" : "+") + padDigits(Math.abs(tz.hour), 2) + padDigits(tz.minute, 2)
}

/**
 * Adjust the date by the given timezone
 * @param d Date object
 * @param tz Timezone
 */
function adjustDate(d: Date, tz: Timezone) {
  let sign = tz.hour < 0 ? -1 : 1
  d.setUTCHours(d.getUTCHours() + tz.hour)
  d.setUTCMinutes(d.getUTCMinutes() + (sign * tz.minute))
}

/**
 * Computes a date expression
 */
function computeDate(obj: any, expr: any, options: Options): Date {
  let d = computeValue(obj, expr, null, options)
  if (isDate(d)) return d
  if (isString(d)) throw Error('cannot take a string as an argument')

  let tz: Timezone = null
  if (isObject(d) && has(d, 'date') && has(d, 'timezone')) {
    tz = parseTimezone(computeValue(obj, d.timezone, null, options))
    d = computeValue(obj, d.date, null, options)
  }

  d = new Date(d)
  if (isNaN(d.getTime())) throw Error(`cannot convert ${obj} to date`)

  adjustDate(d, tz)

  return d
}

/**
 * Returns the day of the year for a date as a number between 1 and 366 (leap year).
 * @param obj
 * @param expr
 */
export function $dayOfYear(obj: object, expr: any, options: Options): number {
  let d = computeDate(obj, expr, options)
  let start = new Date(d.getUTCFullYear(), 0, 0)
  let diff = d.getTime() - start.getTime()
  return Math.round(diff / ONE_DAY_MILLIS)
}

/**
 * Returns the day of the month for a date as a number between 1 and 31.
 * @param obj
 * @param expr
 */
export function $dayOfMonth(obj: object, expr: any, options: Options): number {
  let d = computeDate(obj, expr, options)
  return d.getUTCDate()
}

/**
 * Returns the day of the week for a date as a number between 1 (Sunday) and 7 (Saturday).
 * @param obj
 * @param expr
 */
export function $dayOfWeek(obj: object, expr: any, options: Options): number {
  let d = computeDate(obj, expr, options)
  return d.getUTCDay() + 1
}

/**
 * Returns the year for a date as a number (e.g. 2014).
 * @param obj
 * @param expr
 */
export function $year(obj: object, expr: any, options: Options): number {
  let d = computeDate(obj, expr, options)
  return d.getUTCFullYear()
}

/**
 * Returns the month for a date as a number between 1 (January) and 12 (December).
 * @param obj
 * @param expr
 */
export function $month(obj: object, expr: any, options: Options): number {
  let d = computeDate(obj, expr, options)
  return d.getUTCMonth() + 1
}

/**
 * Returns the week number for a date as a number between 0
 * (the partial week that precedes the first Sunday of the year) and 53 (leap year).
 * @param obj
 * @param expr
 */
export function $week(obj: object, expr: any, options: Options): number {
  // source: http://stackoverflow.com/a/6117889/1370481
  let d = computeDate(obj, expr, options)

  // Copy date so don't modify original
  d = new Date(+d)
  d.setUTCHours(0, 0, 0)
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  // Get first day of year
  let yearStart = new Date(d.getUTCFullYear(), 0, 1)
  // Calculate full weeks to nearest Thursday
  return Math.floor((((d.getTime() - yearStart.getTime()) / 8.64e7) + 1) / 7)
}

/**
 * Returns the hour for a date as a number between 0 and 23.
 * @param obj
 * @param expr
 */
export function $hour(obj: object, expr: any, options: Options): number {
  let d = computeDate(obj, expr, options)
  return d.getUTCHours()
}

/**
 * Returns the minute for a date as a number between 0 and 59.
 * @param obj
 * @param expr
 */
export function $minute(obj: object, expr: any, options: Options): number {
  let d = computeDate(obj, expr, options)
  return d.getUTCMinutes()
}

/**
 * Returns the seconds for a date as a number between 0 and 60 (leap seconds).
 * @param obj
 * @param expr
 */
export function $second(obj: object, expr: any, options: Options): number {
  let d = computeDate(obj, expr, options)
  return d.getUTCSeconds()
}

/**
 * Returns the milliseconds of a date as a number between 0 and 999.
 * @param obj
 * @param expr
 */
export function $millisecond(obj: object, expr: any, options: Options): number {
  let d = computeDate(obj, expr, options)
  return d.getUTCMilliseconds()
}

// used for formatting dates in $dateToString operator
const DATE_SYM_TABLE = {
  '%Y': ['year', $year, 4, /([0-9]{4})/],
  '%G': ['year', $year, 4, /([0-9]{4})/],
  '%m': ['month', $month, 2, /(0[1-9]|1[012])/],
  '%d': ['day', $dayOfMonth, 2, /(0[1-9]|[12][0-9]|3[01])/],
  '%H': ['hour', $hour, 2, /([01][0-9]|2[0-3])/],
  '%M': ['minute', $minute, 2, /([0-5][0-9])/],
  '%S': ['second', $second, 2, /([0-5][0-9]|60)/],
  '%L': ['millisecond', $millisecond, 3, /([0-9]{3})/],
  '%u': ['weekDay', $dayOfWeek, 1, /([1-7])/],
  '%V': ['week', $week, 1, /([1-4][0-9]?|5[0-3]?)/],
  '%z': ['timezone', null, 0, /(([+-][01][0-9]|2[0-3]):?([0-5][0-9])?)/],
  '%Z': ['minuteOffset', null, 0, /([+-][0-9]{3})/],
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
    let hdlr = DATE_SYM_TABLE[matches[i]]
    let value: string

    if (isArray(hdlr)) {
      // reuse date
      let [name, operatorFn, pad, _] = hdlr
      if (name === 'timezone') {
        value = formatTimezone(tz)
      } else if (name === 'minuteOffset') {
        value = `${(tz.hour < 0 ? -1 : 1) * Math.abs(tz.hour * MINUTES_PER_HOUR) + tz.minute}`
      } else if (operatorFn != null) {
        value = padDigits(operatorFn(obj, date, options), pad)
      } else {
        value = hdlr
      }
    } else {
      value = hdlr
    }
    // replace the match with resolved value
    format = format.replace(matches[i], value)
  }

  return format
}

function padDigits(n: number, digits: number): string {
  return new Array(Math.max(digits - String(n).length + 1, 0)).join('0') + n
}

function regexQuote(s: string): string {
  "^.\-*?$".split('').forEach((c: string) => {
    s = s.replace(c, `\\${c}`)
  })
  return s
}

function regexStrip(s: string): string {
  return s.replace(/^\//, '').replace(/\/$/, '')
}

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
    let hdlr = DATE_SYM_TABLE[formatSpecifier]

    if (isArray(hdlr)) {
      // get pattern and alias from table
      let name = hdlr[0]
      let pattern = hdlr[3]
      let m = dateString.match(pattern)

      // get the next separtor
      let delimiter = separators.pop() || ''

      if (m !== null) {
        // store and cut out matched part
        dateParts[name] = m[0].match(/^\d+$/) ? parseInt(m[0]) : m[0]
        dateString = dateString.substr(0, m.index) + dateString.substr(m.index + m[0].length)

        // construct expected pattern
        expectedPattern += (regexQuote(delimiter) + regexStrip(pattern.toString()))
      } else {
        dateParts[name] = null
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

// Inclusive interval of date parts
const DATE_PART_INTERVAL = [
  ['year', 0, 9999],
  ['month', 1, 12],
  ['day', 1, 31],
  ['hour', 0, 23],
  ['minute', 0, 59],
  ['second', 0, 59],
  ['millisecond', 0, 999]
]

/**
 * Constructs and returns a Date object given the date’s constituent properties.
 *
 * @param obj The document
 * @param expr The date expression
 * @param options Options
 */
export function $dateFromParts(obj: object, expr: any, options: Options): any {
  let args: {
    year: number
    month?: number
    day?: number
    hour?: number
    minute?: number
    second?: number
    millisecond?: number
    timezone?: string
  } = computeValue(obj, expr, null, options)

  let tz = parseTimezone(args.timezone)

  // assign default and adjust value ranges of the different parts

  for (let i = DATE_PART_INTERVAL.length-1, remainder = 0; i >= 0; i--) {
    let [k, min, max] = DATE_PART_INTERVAL[i]
    min = min as number
    max = max as number

    // add remainder from previous part. units should already be correct
    let part = (args[k] || 0) + remainder

    // 1. compute the remainder for the next part
    // 2. adjust the current part to a valid range
    // 3. assign back to 'args'
    let limit = max + 1

    // invert timezone to adjust the hours to UTC
    if (k == 'hour') part += (tz.hour * -1)
    if (k == 'minute') part += (tz.minute * -1)

    // smaller than lower bound
    if (part < min) {
      let delta = min - part
      remainder = -1 * Math.ceil(delta / limit)
      part = limit - (delta % limit)
    } else if (part > max) {
      // offset with the 'min' value to adjust non-zero date parts correctly
      part += min
      remainder = Math.trunc(part / limit)
      part %= limit
    }

    // reassign
    args[k] = part
  }

  return new Date(Date.UTC(args.year, args.month-1, args.day, args.hour, args.minute, args.second, args.millisecond))
}