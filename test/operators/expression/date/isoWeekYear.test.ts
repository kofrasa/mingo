import { runTest, testPath } from "../../../support";

runTest(testPath(__filename), {
  $isoWeekYear: [
    [new Date("2016-01-01T00:00:00Z"), 2016],
    [{ date: new Date("2016-01-01T00:00:00Z"), timezone: "-0500" }, 2015],
  ],
});
