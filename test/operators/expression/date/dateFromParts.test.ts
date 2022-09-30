import { runTest, testPath } from "../../../support";

/**
 * A test fixture of inputs and output.
 * @param d The date string of the result to be produced.
 * @param parts The parts in order; year, month, day
 * @returns
 */
const fixture = (d: string, ...parts: number[]) => [
  {
    year: parts[0],
    month: parts[1],
    day: parts[2],
    hour: parts[3],
    minute: parts[4],
    second: parts[5],
  },
  new Date(d),
];

const fixtureWithTz = (d: string, tz: string, ...parts: number[]) => {
  const data = fixture(d, ...parts);
  data[0]["timezone"] = tz;
  return data;
};

runTest(testPath(__filename), {
  $dateFromParts: [
    // exampels
    fixture("2022-01-31T00:00:00Z", 2022, 2, 0),
    fixture("2022-01-30T00:00:00Z", 2022, 1, 30),
    fixture("2022-02-28T00:00:00Z", 2022, 3, 0),
    fixture("2021-12-01T00:00:00Z", 2022, 0, 1),
    fixture("2021-12-31T00:00:00Z", 2022, 1, 0),
    // MongoDB examples
    fixture("2017-02-08T12:00:00Z", 2017, 2, 8, 12),
    fixture("2018-02-01T12:00:00Z", 2017, 14, 1, 12),
    fixture("2017-01-31T12:00:00Z", 2017, 2, 0, 12),
    fixtureWithTz("2017-01-01T04:46:12Z", "-0500", 2016, 12, 31, 23, 46, 12),
  ],
});
