import { runTest, testPath } from "../../../support";

runTest(testPath(__filename), {
  $dayOfYear: [
    [{ date: new Date("2016-01-01T00:00:00Z"), timezone: "-0500" }, 365],
  ],
});
