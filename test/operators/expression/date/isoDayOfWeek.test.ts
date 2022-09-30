import { runTest, testPath } from "../../../support";

runTest(testPath(__filename), {
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
});
