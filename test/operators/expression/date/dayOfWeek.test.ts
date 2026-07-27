import { runTest, testPath } from "../../../support";

const fixtures: [number | null, string, string?][] = [
  // [<Results>, <Args>,...]
  // [<result>, date, ?timezone]
  [6, "2016-01-01T00:00:00Z"],
  [3, "2003-01-07T00:00:00Z"],
  [1, "2011-08-14T00:00:00Z"],
  [7, "2011-08-14T00:00:00Z", "America/Chicago"],
  [7, "1998-11-07T00:00:00Z"],
  [6, "1998-11-07T00:00:00Z", "-0400"]
] as const;

runTest(testPath(import.meta.url), {
  $dayOfWeek: fixtures.map(([result, date, timezone]) => [
    {
      date: new Date(date),
      timezone
    },
    result
  ])
});
