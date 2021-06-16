import test from "tape";

import { aggregate } from "../../src";
import { RawObject } from "../../src/types";
import * as support from "../support";

support.runTest("Date operators:", {
  $dateFromString: [
    [
      { dateString: "2017-02-08T12:10:40.787" },
      new Date("2017-02-08T12:10:40.787Z"),
    ],

    [
      { dateString: "2017-02-08T12:10:40.787", timezone: "America/New_York" },
      "timezone error",
      { err: true },
    ],

    [
      { dateString: "2017-02-08T12:10:40.787", timezone: "+0500" },
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
  ],
});

test("Date Operators", (t) => {
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

    t.equals(result.year, 2014, "can apply $year");
    t.equals(result.month, 1, "can apply $month");
    t.equals(result.day, 1, "can apply $day");
    t.equals(result.hour, 8, "can apply $hour");
    t.equals(result.minutes, 15, "can apply $minutes");
    t.equals(result.seconds, 39, "can apply $seconds");
    t.equals(result.milliseconds, 736, "can apply $milliseconds");
    t.equals(result.dayOfWeek, 4, "can apply $dayOfWeek");
    t.equals(result.dayOfYear, 1, "can apply $dayOfYear");
    t.equals(result.week, 0, "can apply $week");
    t.equals(result.yearMonthDay, "2014-01-01", "formats date to string");
    t.equals(result.time, "08:15:39:736", "formats time to string");
    t.equals(result.yearMonthDayUTC, "2014-01-01", "format date with timezone");
    t.equals(
      result.timewithOffset430,
      "12:45:39:736+0430",
      "format time with timezone"
    );
    t.equals(result.minutesOffset430, "270", "format minutes with timezone");

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

    t.equals(result.hour, 1, "can apply $hour with timezone");
  }

  {
    const result = aggregate(
      [
        {
          _id: 1,
          date: "2017-02-08T12:10:40.787",
          timezone: "+0530",
          message: "Step 1: Started",
        },
        {
          _id: 2,
          date: "2017-02-08",
          timezone: "-05:00",
          message: "Step 1: Ended",
        },
        { _id: 3, message: "Step 1: Ended" },
        {
          _id: 4,
          date: "2017-02-09",
          timezone: "+0000",
          message: "Step 2: Started",
        },
        { _id: 5, date: "2017-02-09T03:35:02.055", timezone: "+0530" },
        { _id: 6, date: "20177-02-09T03:35:02.055", timezone: "+0530" },
      ],
      [
        {
          $project: {
            date: {
              $dateFromString: {
                dateString: "$date",
                timezone: "+0530",
                onError: "$date",
              },
            },
          },
        },
      ]
    );

    t.deepEqual(
      result,
      [
        { _id: 1, date: new Date("2017-02-08T17:10:40.787Z") },
        { _id: 2, date: new Date("2017-02-08T05:00:00Z") },
        { _id: 3, date: null },
        { _id: 4, date: new Date("2017-02-09T05:00:00Z") },
        { _id: 5, date: new Date("2017-02-09T08:35:02.055Z") },
        { _id: 6, date: "20177-02-09T03:35:02.055" },
      ],
      "can apply $dateFromString"
    );
  }

  {
    const result = aggregate(
      [
        { _id: 1, date: "2017-02-08T12:10:40.787", timezone: "+0530" },
        { _id: 2, date: null, timezone: "+0530" },
      ],
      [
        {
          $project: {
            date: {
              $dateFromString: {
                dateString: "$date",
                timezone: "$timezone",
                onNull: new Date(0),
              },
            },
          },
        },
      ]
    );

    t.deepEqual(
      result,
      [
        { _id: 1, date: new Date("2017-02-08T17:10:40.787Z") },
        { _id: 2, date: new Date("1970-01-01T00:00:00Z") },
      ],
      "can apply $dateFromString with onNull option"
    );
  }

  t.end();
});

test("Date Operators: $dateFromParts", (t) => {
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
          $dateFromParts: { year: 2017, month: 0, day: 1, hour: 12 },
        },
      },
    },
  ])[0] as RawObject;

  t.deepEqual(
    result.date,
    new Date("2017-02-08T12:00:00Z"),
    "can apply $dateFromParts without all parts"
  );
  t.deepEqual(
    result.date_range_greater,
    new Date("2018-02-01T12:00:00Z"),
    "can apply $dateFromParts with date parts above range of values"
  );
  t.deepEqual(
    result.date_range_lesser,
    new Date("2016-12-01T12:00:00Z"),
    "can apply $dateFromParts with date parts below range of values"
  );
  t.deepEqual(
    result.date_timezone,
    new Date("2017-01-01T04:46:12Z"),
    "can apply $dateFromParts with timezone"
  );

  t.end();
});

test("Date Operators: $dateToParts", (t) => {
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
        // unsupported
        // date_iso: {
        //   $dateToParts: { date: "$date", iso8601: true }
        // },
        date_timezone: {
          $dateToParts: { date: "$date", timezone: "+0500" },
        },
      },
    },
  ]);

  t.deepEqual(
    result,
    [
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
        // "date_iso" : {
        //   "isoWeekYear" : 2016,
        //   "isoWeek" : 52,
        //   "isoDayOfWeek" : 7,
        //   "hour" : 1,
        //   "minute" : 29,
        //   "second" : 9,
        //   "millisecond" : 123
        // },
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
    ],
    "can apply $dateToParts with timezone"
  );

  t.end();
});
