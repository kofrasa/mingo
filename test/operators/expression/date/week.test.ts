import { runTest, testPath } from "../../../support";

const fixtures: [number | null, string, string?][] = [
  // [<Results>, <Args>,...]
  // [<result>, date, ?timezone]
  [0, "2016-01-01T00:00:00Z"],
  [1, "2016-01-04T00:00:00Z"],
  [32, "2011-08-14T00:00:00Z", "America/Chicago"],
  [44, "1998-11-07T00:00:00Z"],
  [44, "1998-11-07T00:00:00Z", "-0500"],
  // days before the first Sunday are in week 0, that Sunday starts week 1
  [0, "2024-01-06T00:00:00Z"],
  [1, "2024-01-07T00:00:00Z"],
  [1, "2024-01-13T00:00:00Z"],
  [2, "2024-01-14T00:00:00Z"],
  // a year starting on Sunday has no week 0
  [1, "2023-01-01T00:00:00Z"],
  [0, "2022-01-01T00:00:00Z"],
  [1, "2022-01-02T00:00:00Z"],
  [52, "2024-12-31T00:00:00Z"],
  [53, "2000-12-31T00:00:00Z"]
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
