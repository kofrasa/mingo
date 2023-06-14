import { aggregate } from "../../../../src";
import { DEFAULT_OPTS, testPath } from "../../../support";

describe(testPath(__filename), () => {
  it("can apply $dateToParts with timezone", () => {
    const data = [
      {
        _id: 2,
        item: "abc",
        price: 10,
        quantity: 2,
        date: new Date("2017-01-01T01:29:09.123Z")
      }
    ];

    const result = aggregate(
      data,
      [
        {
          $project: {
            date: {
              $dateToParts: { date: "$date" }
            },
            date_iso: {
              $dateToParts: { date: "$date", iso8601: true }
            },
            date_timezone: {
              $dateToParts: { date: "$date", timezone: "-0500" }
            }
          }
        }
      ],
      DEFAULT_OPTS
    );

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
          millisecond: 123
        },
        date_iso: {
          isoWeekYear: 2016,
          isoWeek: 52,
          isoDayOfWeek: 7,
          hour: 1,
          minute: 29,
          second: 9,
          millisecond: 123
        },
        date_timezone: {
          year: 2016,
          month: 12,
          day: 31,
          hour: 20,
          minute: 29,
          second: 9,
          millisecond: 123
        }
      }
    ]);
  });
});
