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
  $dateSubtract: [
    [{ ...apply3Units, unit: "year" }, yearDate, { obj: testDate }],
    [{ ...apply3Units, unit: "quarter" }, quarterDate, { obj: testDate }],
    [{ ...apply3Units, unit: "month" }, monthDate, { obj: testDate }],
    [{ ...apply3Units, unit: "week" }, weekDate, { obj: testDate }],
    [{ ...apply3Units, unit: "day" }, dayDate, { obj: testDate }],
    [{ ...apply3Units, unit: "hour" }, hourDate, { obj: testDate }],
    [{ ...apply3Units, unit: "minute" }, minuteDate, { obj: testDate }],
    [{ ...apply3Units, unit: "second" }, secondDate, { obj: testDate }],
    [
      { ...apply3Units, unit: "millisecond" },
      millisecondDate,
      { obj: testDate },
    ],
  ],
});
