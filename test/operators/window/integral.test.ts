import { aggregate } from "../../../src";
import { initOptions, ProcessingMode } from "../../../src/core";
import { DEFAULT_OPTS } from "../../support";

const options = initOptions({
  ...DEFAULT_OPTS,
  processingMode: ProcessingMode.CLONE_INPUT
});

describe("operators/window/integral", () => {
  describe("$integral", () => {
    it("Can Compute Integral with Unit", () => {
      const result = aggregate(
        [
          {
            powerMeterID: "1",
            timeStamp: new Date("2020-05-18T14:10:30Z"),
            kilowatts: 2.95
          },
          {
            powerMeterID: "1",
            timeStamp: new Date("2020-05-18T14:11:00Z"),
            kilowatts: 2.7
          },
          {
            powerMeterID: "1",
            timeStamp: new Date("2020-05-18T14:11:30Z"),
            kilowatts: 2.6
          },
          {
            powerMeterID: "1",
            timeStamp: new Date("2020-05-18T14:12:00Z"),
            kilowatts: 2.98
          },
          {
            powerMeterID: "2",
            timeStamp: new Date("2020-05-18T14:10:30Z"),
            kilowatts: 2.5
          },
          {
            powerMeterID: "2",
            timeStamp: new Date("2020-05-18T14:11:00Z"),
            kilowatts: 2.25
          },
          {
            powerMeterID: "2",
            timeStamp: new Date("2020-05-18T14:11:30Z"),
            kilowatts: 2.75
          },
          {
            powerMeterID: "2",
            timeStamp: new Date("2020-05-18T14:12:00Z"),
            kilowatts: 2.82
          }
        ],
        [
          {
            $setWindowFields: {
              partitionBy: "$powerMeterID",
              sortBy: { timeStamp: 1 },
              output: {
                powerMeterKilowattHours: {
                  $integral: {
                    input: "$kilowatts",
                    unit: "hour"
                  },
                  window: {
                    range: ["unbounded", "current"],
                    unit: "hour"
                  }
                }
              }
            }
          }
        ],
        options
      );

      expect(result).toStrictEqual([
        {
          powerMeterID: "1",
          timeStamp: new Date("2020-05-18T14:10:30Z"),
          kilowatts: 2.95,
          powerMeterKilowattHours: 0
        },
        {
          powerMeterID: "1",
          timeStamp: new Date("2020-05-18T14:11:00Z"),
          kilowatts: 2.7,
          powerMeterKilowattHours: 0.02354166666666667
        },
        {
          powerMeterID: "1",
          timeStamp: new Date("2020-05-18T14:11:30Z"),
          kilowatts: 2.6,
          powerMeterKilowattHours: 0.045625000000000006
        },
        {
          powerMeterID: "1",
          timeStamp: new Date("2020-05-18T14:12:00Z"),
          kilowatts: 2.98,
          powerMeterKilowattHours: 0.068875
        },
        {
          powerMeterID: "2",
          timeStamp: new Date("2020-05-18T14:10:30Z"),
          kilowatts: 2.5,
          powerMeterKilowattHours: 0
        },
        {
          powerMeterID: "2",
          timeStamp: new Date("2020-05-18T14:11:00Z"),
          kilowatts: 2.25,
          powerMeterKilowattHours: 0.019791666666666666
        },
        {
          powerMeterID: "2",
          timeStamp: new Date("2020-05-18T14:11:30Z"),
          kilowatts: 2.75,
          powerMeterKilowattHours: 0.040624999999999994
        },
        {
          powerMeterID: "2",
          timeStamp: new Date("2020-05-18T14:12:00Z"),
          kilowatts: 2.82,
          powerMeterKilowattHours: 0.06383333333333333
        }
      ]);
    });
  });
});
