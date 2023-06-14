import { aggregate } from "../../../src";
import { initOptions, ProcessingMode } from "../../../src/core";
import { DEFAULT_OPTS } from "../../support";

const options = initOptions({
  ...DEFAULT_OPTS,
  processingMode: ProcessingMode.CLONE_INPUT
});

describe("operators/window/derivative", () => {
  describe("$derivative", () => {
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
});
