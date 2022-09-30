import { runTest, testPath } from "../../../support";
import {
  apply3Units,
  dayDate,
  hourDate,
  millisecondDate,
  minuteDate,
  monthDate,
  quarterDate,
  secondDate,
  testDate,
  weekDate,
  yearDate,
} from "./data";

runTest(testPath(__filename), {
  $dateAdd: [
    [{ ...apply3Units, unit: "year" }, testDate, { obj: yearDate }],
    [{ ...apply3Units, unit: "quarter" }, testDate, { obj: quarterDate }],
    [{ ...apply3Units, unit: "month" }, testDate, { obj: monthDate }],
    [{ ...apply3Units, unit: "week" }, testDate, { obj: weekDate }],
    [{ ...apply3Units, unit: "day" }, testDate, { obj: dayDate }],
    [{ ...apply3Units, unit: "hour" }, testDate, { obj: hourDate }],
    [{ ...apply3Units, unit: "minute" }, testDate, { obj: minuteDate }],
    [{ ...apply3Units, unit: "second" }, testDate, { obj: secondDate }],
    [
      { ...apply3Units, unit: "millisecond" },
      testDate,
      { obj: millisecondDate },
    ],
  ],
});
