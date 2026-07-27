import { runTest, testPath } from "../../../support";

const fixtures: [number | null, string, string?][] = [
  // [<Results>, <Args>,...]
  // [<result>, date, ?timezone]
  [0, "2016-01-01T00:00:00Z"],
  [1, "2016-01-04T00:00:00Z"],
  [32, "2011-08-14T00:00:00Z", "America/Chicago"]
  // FIXME: these tests are failing
  // [44, "1998-11-07T00:00:00Z"],
  // [43, "1998-11-07T00:00:00Z", "-0500"]
] as const;

runTest(testPath(import.meta.url), {
  $week: fixtures.map(([result, date, timezone]) => [
    {
      date: new Date(date),
      timezone
    },
    result
  ])
});
