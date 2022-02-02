import { aggregate } from "../../../src";
import { AnyVal, RawArray, RawObject } from "../../../src/types";
import * as support from "../../support";

const apply3Units = {
  startDate: "$$this",
  amount: 3,
  timezone: "+00",
};

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
  $dateFromString: [
    [
      { dateString: "2017-02-08T12:10:40.787" },
      new Date("2017-02-08T12:10:40.787Z"),
    ],

    [
      { dateString: "2017-02-08T12:10:40.787", timezone: "-0500" },
      new Date("2017-02-08T17:10:40.787Z"),
    ],

    [{ dateString: "2017-02-08" }, new Date("2017-02-08T00:00:00Z")],

    [
      {
        dateString: "06-15-2018",
        format: "%m-%d-%Y",
      },
      new Date("2018-06-15T00:00:00Z"),
    ],

    [
      {
        dateString: "15-06-2018",
        format: "%d-%m-%Y",
      },
      new Date("2018-06-15T00:00:00Z"),
    ],

    [
      {
        dateString: "2017-02-09T03:35:02.055",
        timezone: "-0500",
      },
      new Date("2017-02-09T08:35:02.055Z"),
    ],
  ],

  $dateFromParts: dateFromPartsFixtures(),
});

function dateFromPartsFixtures(): RawArray[] {
  const input = [
    {
      year: 2022,
      month: 2,
      day: 0,
    },
    {
      year: 2022,
      month: 1,
      day: 30,
    },
    {
      year: 2022,
      month: 3,
      day: 0,
    },
    {
      year: 2022,
      month: 0,
      day: 1,
    },
    {
      year: 2022,
      month: 1,
      day: 0,
    },
  ];
  const output = [
    new Date("2022-01-31T00:00:00Z"),
    new Date("2022-01-30T00:00:00Z"),
    new Date("2022-02-28T00:00:00Z"),
    new Date("2021-12-01T00:00:00Z"),
    new Date("2021-12-31T00:00:00Z"),
  ];

  const res = aggregate(
    [{ val: [input, output] }],
    [{ $project: { value: { $zip: { inputs: "$val" } } } }]
  );

  return res[0]["value"] as RawArray[];
}

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
    ).pop() as RawObject;

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
    ).pop() as RawObject;

    check(result.hour, 1, "can apply $hour with timezone");
  }
});

describe("Date Operators: $dateFromParts", () => {
  const data = [
    {
      _id: 1,
      item: "abc",
      price: 20,
      quantity: 5,
      date: new Date("2017-05-20T10:24:51.303Z"),
    },
  ];
  const result = aggregate(data, [
    {
      $project: {
        date: {
          $dateFromParts: {
            year: 2017,
            month: 2,
            day: 8,
            hour: 12,
          },
        },
        date_timezone: {
          $dateFromParts: {
            year: 2016,
            month: 12,
            day: 31,
            hour: 23,
            minute: 46,
            second: 12,
            timezone: "-0500",
          },
        },
        date_range_greater: {
          $dateFromParts: { year: 2017, month: 14, day: 1, hour: 12 },
        },
        date_range_lesser: {
          $dateFromParts: { year: 2017, month: 2, day: 0, hour: 12 },
        },
      },
    },
  ])[0] as RawObject;

  it("can apply $dateFromParts without all parts", () => {
    expect(result.date).toEqual(new Date("2017-02-08T12:00:00Z"));
  });

  it("can apply $dateFromParts with date parts above range of values", () => {
    expect(result.date_range_greater).toEqual(new Date("2018-02-01T12:00:00Z"));
  });

  it("can apply $dateFromParts with date parts below range of values", () => {
    expect(result.date_range_lesser).toEqual(new Date("2017-01-31T12:00:00Z"));
  });

  it("can apply $dateFromParts with timezone", () => {
    expect(result.date_timezone).toEqual(new Date("2017-01-01T04:46:12Z"));
  });
});

it("can apply $dateToParts with timezone", () => {
  const data = [
    {
      _id: 2,
      item: "abc",
      price: 10,
      quantity: 2,
      date: new Date("2017-01-01T01:29:09.123Z"),
    },
  ];

  const result = aggregate(data, [
    {
      $project: {
        date: {
          $dateToParts: { date: "$date" },
        },
        date_iso: {
          $dateToParts: { date: "$date", iso8601: true },
        },
        date_timezone: {
          $dateToParts: { date: "$date", timezone: "+0500" },
        },
      },
    },
  ]);

  expect(result).toEqual([
    {
      _id: 2,
      date: {
        year: 2017,
        month: 1,
        day: 1,
        hour: 1,
        minute: 29,
        second: 9,
        millisecond: 123,
      },
      date_iso: {
        isoWeekYear: 2016,
        isoWeek: 52,
        isoDayOfWeek: 7,
        hour: 1,
        minute: 29,
        second: 9,
        millisecond: 123,
      },
      date_timezone: {
        year: 2016,
        month: 12,
        day: 31,
        hour: 20,
        minute: 29,
        second: 9,
        millisecond: 123,
      },
    },
  ]);
});
