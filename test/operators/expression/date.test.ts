import { describe, expect, it } from "vitest";

import * as mingo from "../../../src";
import { testPath } from "../../support";

describe(testPath(import.meta.url), () => {
  // https://github.com/kofrasa/mingo/issues/587
  it("FIX #587: should correctly handle timezones", () => {
    const data = [
      {
        _id: 1,
        timestamp: new Date("2025-10-17T18:00:00+02:00")
      }
    ];

    const result = mingo.aggregate(data, [
      {
        $project: {
          olsonHour: {
            $let: {
              vars: {
                parts: {
                  $dateToParts: {
                    date: "$timestamp",
                    timezone: "Europe/Berlin"
                  }
                }
              },
              in: "$$parts.hour"
            }
          },
          offsetHour: {
            $let: {
              vars: {
                parts: {
                  $dateToParts: {
                    date: "$timestamp",
                    timezone: "+02:00"
                  }
                }
              },
              in: "$$parts.hour"
            }
          },
          hour: {
            $let: {
              vars: {
                parts: {
                  $dateToParts: {
                    date: "$timestamp"
                  }
                }
              },
              in: "$$parts.hour"
            }
          },
          olsonFormatted: {
            $dateToString: {
              date: "$timestamp",
              format: "%Y-%m-%dT%H:%M:%S%z",
              timezone: "Europe/Berlin"
            }
          },
          offsetFormatted: {
            $dateToString: {
              date: "$timestamp",
              format: "%Y-%m-%dT%H:%M:%S%z",
              timezone: "+02:00"
            }
          }
        }
      }
    ]);
    expect(result).toEqual([
      {
        _id: 1,
        offsetFormatted: "2025-10-17T18:00:00+0200",
        offsetHour: 18,
        olsonFormatted: "2025-10-17T18:00:00+0200",
        olsonHour: 18,
        hour: 16
      }
    ]);
  });
});
