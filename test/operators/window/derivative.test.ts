import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { ProcessingMode } from "../../../src/core/_internal";
import { ISODate, testPath } from "../../support";

const options = {
  processingMode: ProcessingMode.CLONE_INPUT
};

describe(testPath(import.meta.url), () => {
  it("compute derivative with default unit", () => {
    const result = aggregate(
      [
        { t: ISODate("2025-01-01T00:00:00.000Z"), y: 0 },
        { t: ISODate("2025-01-01T00:00:00.001Z"), y: 2 },
        { t: ISODate("2025-01-01T00:00:00.002Z"), y: 4 },
        { t: ISODate("2025-01-01T00:00:00.003Z"), y: 6 }
      ],
      [
        {
          $setWindowFields: {
            sortBy: { t: 1 },
            output: {
              derivative: {
                $derivative: {
                  input: "$y"
                },
                window: {
                  documents: ["unbounded", "current"]
                }
              }
            }
          }
        },
        { $project: { t: 0 } }
      ]
    );

    expect(result).toStrictEqual([
      { y: 0, derivative: null },
      { y: 2, derivative: 2 },
      { y: 4, derivative: 2 },
      { y: 6, derivative: 2 }
    ]);
  });

  it("Can Compute Derivative with Unit", () => {
    const result = aggregate(
      [
        {
          truckID: "1",
          timeStamp: new Date("2020-05-18T14:10:30Z"),
          miles: 1295.1
        },
        {
          truckID: "1",
          timeStamp: new Date("2020-05-18T14:11:00Z"),
          miles: 1295.63
        },
        {
          truckID: "1",
          timeStamp: new Date("2020-05-18T14:11:30Z"),
          miles: 1296.25
        },
        {
          truckID: "1",
          timeStamp: new Date("2020-05-18T14:12:00Z"),
          miles: 1296.76
        },
        {
          truckID: "2",
          timeStamp: new Date("2020-05-18T14:10:30Z"),
          miles: 10234.1
        },
        {
          truckID: "2",
          timeStamp: new Date("2020-05-18T14:11:00Z"),
          miles: 10234.33
        },
        {
          truckID: "2",
          timeStamp: new Date("2020-05-18T14:11:30Z"),
          miles: 10234.73
        },
        {
          truckID: "2",
          timeStamp: new Date("2020-05-18T14:12:00Z"),
          miles: 10235.13
        }
      ],
      [
        {
          $setWindowFields: {
            partitionBy: "$truckID",
            sortBy: { timeStamp: 1 },
            output: {
              truckAverageSpeed: {
                $derivative: {
                  input: "$miles",
                  unit: "hour"
                },
                window: {
                  range: [-30, 0],
                  unit: "second"
                }
              }
            }
          }
        },
        {
          $match: {
            truckAverageSpeed: {
              $gt: 50
            }
          }
        }
      ],
      options
    );

    expect(result).toStrictEqual([
      {
        truckID: "1",
        timeStamp: new Date("2020-05-18T14:11:00Z"),
        miles: 1295.63,
        truckAverageSpeed: 63.60000000002401
      },
      {
        truckID: "1",
        timeStamp: new Date("2020-05-18T14:11:30Z"),
        miles: 1296.25,
        truckAverageSpeed: 74.3999999999869
      },
      {
        truckID: "1",
        timeStamp: new Date("2020-05-18T14:12:00Z"),
        miles: 1296.76,
        truckAverageSpeed: 61.19999999999891
      }
    ]);
  });
});
