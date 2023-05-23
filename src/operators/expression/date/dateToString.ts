// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, Callback, RawObject } from "../../../types";
import { assert, isNil, isObject } from "../../../util";
import {
  adjustDate,
  computeDate,
  DATE_FORMAT,
  DATE_SYM_TABLE,
  DatePartFormatter,
  formatTimezone,
  padDigits,
  parseTimezone
} from "./_internal";
import { $dayOfMonth } from "./dayOfMonth";
import { $hour } from "./hour";
import { $isoDayOfWeek } from "./isoDayOfWeek";
import { $isoWeek } from "./isoWeek";
import { $millisecond } from "./millisecond";
import { $minute } from "./minute";
import { $month } from "./month";
import { $second } from "./second";
import { $week } from "./week";
import { $year } from "./year";

interface DateOptions {
  date?: Date;
  format?: string;
  timezone?: string;
  onNull: string;
}

// date functions for format specifiers
const DATE_FUNCTIONS: Record<string, Callback<number>> = {
  "%Y": $year,
  "%G": $year,
  "%m": $month,
  "%d": $dayOfMonth,
  "%H": $hour,
  "%M": $minute,
  "%S": $second,
  "%L": $millisecond,
  "%u": $isoDayOfWeek,
  "%U": $week,
  "%V": $isoWeek
};

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
export function $dateToString(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): string {
  const args = computeValue(obj, expr, null, options) as DateOptions;

  if (isNil(args.onNull)) args.onNull = null;
  if (isNil(args.date)) return args.onNull;

  const date = computeDate(obj, args.date, options);
  let format = args.format || DATE_FORMAT;
  const minuteOffset = parseTimezone(args.timezone);
  const matches = format.match(/(%%|%Y|%G|%m|%d|%H|%M|%S|%L|%u|%U|%V|%z|%Z)/g);

  // adjust the date to reflect timezone
  adjustDate(date, minuteOffset);

  for (let i = 0, len = matches.length; i < len; i++) {
    const formatSpecifier = matches[i];
    const props = DATE_SYM_TABLE[formatSpecifier];
    const operatorFn = DATE_FUNCTIONS[formatSpecifier];
    let value: string | DatePartFormatter;

    if (isObject(props)) {
      // reuse date
      if (props.name === "timezone") {
        value = formatTimezone(minuteOffset);
      } else if (props.name === "minuteOffset") {
        value = minuteOffset.toString();
      } else {
        assert(
          !!operatorFn,
          `unsupported date format specifier '${formatSpecifier}'`
        );
        value = padDigits(operatorFn(obj, date, options), props.padding);
      }
    }
    // replace the match with resolved value
    format = format.replace(formatSpecifier, value as string);
  }

  return format;
}
