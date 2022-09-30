import { aggregate } from "../../../src";
import { AnyVal } from "../../../src/types";
import * as support from "../../support";

const testDate = new Date("2021-01-28T13:05:00Z");
// dates less 3 units
const yearDate = new Date("2018-01-28T13:05:00Z");
const quarterDate = new Date("2020-04-28T13:05:00Z");
const monthDate = new Date("2020-10-28T13:05:00Z");
const weekDate = new Date("2021-01-07T13:05:00Z");
const dayDate = new Date("2021-01-25T13:05:00Z");
const hourDate = new Date("2021-01-28T10:05:00Z");
const minuteDate = new Date("2021-01-28T13:02:00Z");
const secondDate = new Date("2021-01-28T13:04:57Z");
const millisecondDate = new Date("2021-01-28T13:04:59.997Z");

const apply3Units = {
  startDate: "$$this",
  amount: 3,
  timezone: "+00",
};
const dateDiff3Units = {
  startDate: "$$this",
  endDate: testDate,
  timezone: "+00",
};

support.runTest("operators/expression/date", {
  $week: [
    [new Date("2016-01-01T00:00:00Z"), 0],
    [new Date("2016-01-04"), 1],
    [{ date: new Date("2011-08-14T06:00:00Z"), timezone: "-0600" }, 33],
    [{ date: new Date("2011-08-20T06:00:00Z"), timezone: "-0600" }, 33],
    [{ date: new Date("2011-08-21T06:00:00Z"), timezone: "-0600" }, 34],
    [{ date: new Date("1998-11-01T00:00:00Z"), timezone: "-0500" }, 44],
    ["2009-04-09", 43, { err: true }],
  ],
  $isoWeek: [
    [new Date("2016-01-04T00:00:00Z"), 1],
    [new Date("2016-01-01"), 53],
    [{ date: new Date("2011-08-14"), timezone: "-0600" }, 32],
    [{ date: new Date("2011-08-15"), timezone: "-0600" }, 32],
    [new Date("1998-11-02T00:00:00Z"), 45],
    [{ date: new Date("1998-11-02T00:00:00Z"), timezone: "-0500" }, 44],
    ["2009-04-09", 43, { err: true }],
  ],
  $isoDayOfWeek: [
    [new Date("2016-01-01"), 5],
    [new Date("2003-01-07"), 2],
    [
      {
        date: new Date("2011-08-14T06:00:00Z"),
        timezone: "-0600",
      },
      7,
    ],
    [new Date("1998-11-07T00:00:00Z"), 6],
    [
      {
        date: new Date("1998-11-07T00:00:00Z"),
        timezone: "-0400",
      },
      5,
    ],
  ],
  $isoWeekYear: [
    [new Date("2015-05-26"), 2015],
    [{ date: new Date("Jan 7, 2003") }, 2003],
    [new Date("2017-01-02T00:00:00Z"), 2017],
    [
      {
        date: new Date("2017-01-02T00:00:00Z"),
        timezone: "-0500",
      },
      2016,
    ],
    [
      {
        date: new Date("April 08, 2024"),
        timezone: "-0600",
      },
      2024,
    ],
  ],
  $dateAdd: [
    [{ ...apply3Units, unit: "year" }, testDate, { obj: yearDate }],
    [{ ...apply3Units, unit: "quarter" }, testDate, { obj: quarterDate }],
    [{ ...apply3Units, unit: "month" }, testDate, { obj: monthDate }],
    [{ ...apply3Units, unit: "week" }, testDate, { obj: weekDate }],
    [{ ...apply3Units, unit: "day" }, testDate, { obj: dayDate }],
    [{ ...apply3Units, unit: "hour" }, testDate, { obj: hourDate }],
    [{ ...apply3Units, unit: "minute" }, testDate, { obj: minuteDate }],
    [{ ...apply3Units, unit: "second" }, testDate, { obj: secondDate }],
    [
      { ...apply3Units, unit: "millisecond" },
      testDate,
      { obj: millisecondDate },
    ],
  ],
  $dateSubtract: [
    [{ ...apply3Units, unit: "year" }, yearDate, { obj: testDate }],
    [{ ...apply3Units, unit: "quarter" }, quarterDate, { obj: testDate }],
    [{ ...apply3Units, unit: "month" }, monthDate, { obj: testDate }],
    [{ ...apply3Units, unit: "week" }, weekDate, { obj: testDate }],
    [{ ...apply3Units, unit: "day" }, dayDate, { obj: testDate }],
    [{ ...apply3Units, unit: "hour" }, hourDate, { obj: testDate }],
    [{ ...apply3Units, unit: "minute" }, minuteDate, { obj: testDate }],
    [{ ...apply3Units, unit: "second" }, secondDate, { obj: testDate }],
    [
      { ...apply3Units, unit: "millisecond" },
      millisecondDate,
      { obj: testDate },
    ],
  ],
  $dateDiff: [
    [{ ...dateDiff3Units, unit: "year" }, 3, { obj: yearDate }],
    [{ ...dateDiff3Units, unit: "quarter" }, 3, { obj: quarterDate }],
    [{ ...dateDiff3Units, unit: "month" }, 3, { obj: monthDate }],
    [{ ...dateDiff3Units, unit: "week" }, 3, { obj: weekDate }],
    [{ ...dateDiff3Units, unit: "day" }, 3, { obj: dayDate }],
    [{ ...dateDiff3Units, unit: "hour" }, 3, { obj: hourDate }],
    [{ ...dateDiff3Units, unit: "minute" }, 3, { obj: minuteDate }],
    [{ ...dateDiff3Units, unit: "second" }, 3, { obj: secondDate }],
    [{ ...dateDiff3Units, unit: "millisecond" }, 3, { obj: millisecondDate }],
  ],
});

describe("Date Operators", () => {
  const check = (actual: AnyVal, expected: AnyVal, message: string) => {
    it(message, () => expect(actual).toEqual(expected));
  };

  const projectionOperator = {
    $project: {
      year: { $year: "$date" },
      month: { $month: "$date" },
      day: { $dayOfMonth: "$date" },
      hour: { $hour: "$date" },
      minutes: { $minute: "$date" },
      seconds: { $second: "$date" },
      milliseconds: { $millisecond: "$date" },
      dayOfYear: { $dayOfYear: "$date" },
      dayOfWeek: { $dayOfWeek: "$date" },
      week: { $week: "$date" },
      yearMonthDay: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
      time: { $dateToString: { format: "%H:%M:%S:%L", date: "$date" } },
      // timezone
      yearMonthDayUTC: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
      timewithOffset430: {
        $dateToString: {
          format: "%H:%M:%S:%L%z",
          date: "$date",
          timezone: "+04:30",
        },
      },
      minutesOffset430: {
        $dateToString: { format: "%Z", date: "$date", timezone: "+04:30" },
      },
    },
  };

  {
    let result = aggregate(
      [
        {
          _id: 1,
          item: "abc",
          price: 10,
          quantity: 2,
          date: new Date("2014-01-01T08:15:39.736Z"),
        },
      ],
      [projectionOperator]
    )[0];

    check(result.year, 2014, "can apply $year");
    check(result.month, 1, "can apply $month");
    check(result.day, 1, "can apply $day");
    check(result.hour, 8, "can apply $hour");
    check(result.minutes, 15, "can apply $minutes");
    check(result.seconds, 39, "can apply $seconds");
    check(result.milliseconds, 736, "can apply $milliseconds");
    check(result.dayOfWeek, 4, "can apply $dayOfWeek");
    check(result.dayOfYear, 1, "can apply $dayOfYear");
    check(result.week, 0, "can apply $week");
    check(result.yearMonthDay, "2014-01-01", "can format date to string");
    check(result.time, "08:15:39:736", "can format time to string");
    check(
      result.yearMonthDayUTC,
      "2014-01-01",
      "can format date with timezone"
    );
    check(
      result.timewithOffset430,
      "12:45:39:736+0430",
      "can format time with timezone"
    );
    check(result.minutesOffset430, "270", "can format minutes with timezone");

    // Test date operators with timezone

    result = aggregate(
      [
        {
          _id: 1,
          item: "abc",
          price: 10,
          quantity: 2,
          date: {
            date: new Date("2014-01-01T08:15:39.736Z"),
            timezone: "-0700",
          },
        },
      ],
      [projectionOperator]
    )[0];

    check(result.hour, 1, "can apply $hour with timezone");
  }
});
