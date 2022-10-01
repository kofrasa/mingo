import { runTest, testPath } from "../../../support";

runTest(testPath(__filename), {
  $dateToString: [
    [
      {
        date: new Date("2021-01-28T13:05:30.257Z"),
        format: "%Y/%m/%d %H:%M:%S.%L%z isoDayOfWeek=%u isoWeek=%V",
      },
      "2021/01/28 13:05:30.257+0000 isoDayOfWeek=4 isoWeek=04",
    ],

    // edge case for weeks when first day of month is not a Sunday.
    [
      {
        date: new Date("2021-01-01T12:05:30.257Z"),
        format: "isoDayOfWeek=%u, week=%U, isoWeek=%V",
      },
      "isoDayOfWeek=5, week=00, isoWeek=53",
    ],
  ],
});
