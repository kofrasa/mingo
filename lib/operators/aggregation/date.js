
// used for formatting dates in $dateToString operator
var DATE_SYM_TABLE = {
  '%Y': ['$year', 4],
  '%m': ['$month', 2],
  '%d': ['$dayOfMonth', 2],
  '%H': ['$hour', 2],
  '%M': ['$minute', 2],
  '%S': ['$second', 2],
  '%L': ['$millisecond', 3],
  '%j': ['$dayOfYear', 3],
  '%w': ['$dayOfWeek', 1],
  '%U': ['$week', 2],
  '%%': '%'
}

var dateOperators = {
  /**
   * Returns the day of the year for a date as a number between 1 and 366 (leap year).
   * @param obj
   * @param expr
   */
  $dayOfYear: function (obj, expr) {
    var d = computeValue(obj, expr, null)
    if (isDate(d)) {
      var start = new Date(d.getFullYear(), 0, 0)
      var diff = d - start
      var oneDay = 1000 * 60 * 60 * 24
      return Math.round(diff / oneDay)
    }
    return undefined
  },

  /**
   * Returns the day of the month for a date as a number between 1 and 31.
   * @param obj
   * @param expr
   */
  $dayOfMonth: function (obj, expr) {
    var d = computeValue(obj, expr, null)
    return isDate(d) ? d.getDate() : undefined
  },

  /**
   * Returns the day of the week for a date as a number between 1 (Sunday) and 7 (Saturday).
   * @param obj
   * @param expr
   */
  $dayOfWeek: function (obj, expr) {
    var d = computeValue(obj, expr, null)
    return isDate(d) ? d.getDay() + 1 : undefined
  },

  /**
   * Returns the year for a date as a number (e.g. 2014).
   * @param obj
   * @param expr
   */
  $year: function (obj, expr) {
    var d = computeValue(obj, expr, null)
    return isDate(d) ? d.getFullYear() : undefined
  },

  /**
   * Returns the month for a date as a number between 1 (January) and 12 (December).
   * @param obj
   * @param expr
   */
  $month: function (obj, expr) {
    var d = computeValue(obj, expr, null)
    return isDate(d) ? d.getMonth() + 1 : undefined
  },

  /**
   * Returns the week number for a date as a number between 0
   * (the partial week that precedes the first Sunday of the year) and 53 (leap year).
   * @param obj
   * @param expr
   */
  $week: function (obj, expr) {
    // source: http://stackoverflow.com/a/6117889/1370481
    var d = computeValue(obj, expr, null)

    // Copy date so don't modify original
    d = new Date(+d)
    d.setHours(0, 0, 0)
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    // Get first day of year
    var yearStart = new Date(d.getFullYear(), 0, 1)
    // Calculate full weeks to nearest Thursday
    return Math.floor((((d - yearStart) / 8.64e7) + 1) / 7)
  },

  /**
   * Returns the hour for a date as a number between 0 and 23.
   * @param obj
   * @param expr
   */
  $hour: function (obj, expr) {
    var d = computeValue(obj, expr, null)
    return isDate(d) ? d.getUTCHours() : undefined
  },

  /**
   * Returns the minute for a date as a number between 0 and 59.
   * @param obj
   * @param expr
   */
  $minute: function (obj, expr) {
    var d = computeValue(obj, expr, null)
    return isDate(d) ? d.getMinutes() : undefined
  },

  /**
   * Returns the seconds for a date as a number between 0 and 60 (leap seconds).
   * @param obj
   * @param expr
   */
  $second: function (obj, expr) {
    var d = computeValue(obj, expr, null)
    return isDate(d) ? d.getSeconds() : undefined
  },

  /**
   * Returns the milliseconds of a date as a number between 0 and 999.
   * @param obj
   * @param expr
   */
  $millisecond: function (obj, expr) {
    var d = computeValue(obj, expr, null)
    return isDate(d) ? d.getMilliseconds() : undefined
  },

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
  $dateToString: function (obj, expr) {
    var fmt = expr['format']
    var date = computeValue(obj, expr['date'], null)
    var matches = fmt.match(/(%%|%Y|%m|%d|%H|%M|%S|%L|%j|%w|%U)/g)

    for (var i = 0, len = matches.length; i < len; i++) {
      var hdlr = DATE_SYM_TABLE[matches[i]]
      var value = hdlr

      if (isArray(hdlr)) {
        // reuse date operators
        var fn = this[hdlr[0]]
        var pad = hdlr[1]
        value = padDigits(fn.call(this, obj, date), pad)
      }
      // replace the match with resolved value
      fmt = fmt.replace(matches[i], value)
    }

    return fmt
  }
}

function padDigits (number, digits) {
  return new Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number
}
