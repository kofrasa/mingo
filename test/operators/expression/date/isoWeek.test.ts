import { runTest, testPath } from "../../../support";

runTest(testPath(__filename), {
  $isoWeek: [
    [new Date("2016-01-04T00:00:00Z"), 1],
    [new Date("2016-01-01"), 53],
    [new Date("1998-11-02T00:00:00Z"), 45],
    [{ date: new Date("2011-08-14"), timezone: "-0600" }, 32],
    [{ date: new Date("1998-11-02T00:00:00Z"), timezone: "-0500" }, 44],
    ["2009-04-09", 43, { err: true }],
  ],
});
