import { runTest, testPath } from "../../../support";

runTest(testPath(__filename), {
  $dateToString: [
    [
      {
        date: new Date("2021-01-28T13:05:30.257Z"),
        format: "%Y/%m/%d %H:%M:%S.%L%z weekday=%u weekOfYear=%V",
      },
      "2021/01/28 13:05:30.257+0000 weekday=5 weekOfYear=4",
    ],
  ],
});
