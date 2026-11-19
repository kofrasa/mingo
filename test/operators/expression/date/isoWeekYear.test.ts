import { runTest, testPath } from "../../../support";

runTest(testPath(import.meta.url), {
  $isoWeekYear: [
    // 2016-01-01 is a Friday in ISO week 53 of 2015
    [new Date("2016-01-01T00:00:00Z"), 2015],
    [{ date: new Date("2016-01-01T00:00:00Z"), timezone: "-0500" }, 2015],
    [new Date("2016-01-04T00:00:00Z"), 2016],
    [new Date("2022-01-01T00:00:00Z"), 2021],
    [new Date("2022-01-02T00:00:00Z"), 2021],
    [new Date("2022-01-03T00:00:00Z"), 2022],
    // 2024-12-31 is a Tuesday in ISO week 1 of 2025
    [new Date("2024-12-30T00:00:00Z"), 2025],
    [new Date("2024-12-31T00:00:00Z"), 2025],
    [new Date("2024-12-29T00:00:00Z"), 2024],
    [{ date: new Date("2017-01-02T00:00:00Z"), timezone: "-0500" }, 2016]
  ]
});
