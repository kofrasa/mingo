import { runTest, testPath } from "../../../support";
import {
  dateDiff3Units,
  dayDate,
  hourDate,
  millisecondDate,
  minuteDate,
  monthDate,
  quarterDate,
  secondDate,
  weekDate,
  yearDate,
} from "./data";

runTest(testPath(__filename), {
  $dateDiff: [
    [{ ...dateDiff3Units, unit: "year" }, 3, { obj: yearDate }],
    [{ ...dateDiff3Units, unit: "quarter" }, 3, { obj: quarterDate }],
    [{ ...dateDiff3Units, unit: "month" }, 3, { obj: monthDate }],
    [{ ...dateDiff3Units, unit: "week" }, 3, { obj: weekDate }],
    [{ ...dateDiff3Units, unit: "day" }, 3, { obj: dayDate }],
    [{ ...dateDiff3Units, unit: "hour" }, 3, { obj: hourDate }],
    [{ ...dateDiff3Units, unit: "minute" }, 3, { obj: minuteDate }],
    [{ ...dateDiff3Units, unit: "second" }, 3, { obj: secondDate }],
    [{ ...dateDiff3Units, unit: "millisecond" }, 3, { obj: millisecondDate }],
  ],
});
