import { aggregate } from "../../../src";
import { initOptions, ProcessingMode } from "../../../src/core";
import { DEFAULT_OPTS } from "../../support";

const options = initOptions({
  ...DEFAULT_OPTS,
  processingMode: ProcessingMode.CLONE_INPUT
});

const data = [
  { stock: "ABC", date: new Date("2020-05-18T20:00:00Z"), price: 13 },
  { stock: "ABC", date: new Date("2020-05-19T20:00:00Z"), price: 15.4 },
  { stock: "ABC", date: new Date("2020-05-20T20:00:00Z"), price: 12 },
  { stock: "ABC", date: new Date("2020-05-21T20:00:00Z"), price: 11.7 },
  { stock: "DEF", date: new Date("2020-05-18T20:00:00Z"), price: 82 },
  { stock: "DEF", date: new Date("2020-05-19T20:00:00Z"), price: 94 },
  { stock: "DEF", date: new Date("2020-05-20T20:00:00Z"), price: 112 },
  { stock: "DEF", date: new Date("2020-05-21T20:00:00Z"), price: 97.3 }
];

describe("operators/window/expMovingAvg", () => {
  describe("$expMovingAvg", () => {
    it("Exponential Moving Average Using N", () => {
      const result = aggregate(
        data,
        [
          {
            $setWindowFields: {
              partitionBy: "$stock",
              sortBy: { date: 1 },
              output: {
                expMovingAvgForStock: {
                  $expMovingAvg: { input: "$price", N: 2 }
                }
              }
            }
          }
        ],
        options
      );

      expect(result).toStrictEqual([
        {
          stock: "ABC",
          date: new Date("2020-05-18T20:00:00Z"),
          price: 13,
          expMovingAvgForStock: 13
        },
        {
          stock: "ABC",
          date: new Date("2020-05-19T20:00:00Z"),
          price: 15.4,
          expMovingAvgForStock: 14.6
        },
        {
          stock: "ABC",
          date: new Date("2020-05-20T20:00:00Z"),
          price: 12,
          expMovingAvgForStock: 12.866666666666667
        },
        {
          stock: "ABC",
          date: new Date("2020-05-21T20:00:00Z"),
          price: 11.7,
          expMovingAvgForStock: 12.088888888888889
        },
        {
          stock: "DEF",
          date: new Date("2020-05-18T20:00:00Z"),
          price: 82,
          expMovingAvgForStock: 82
        },
        {
          stock: "DEF",
          date: new Date("2020-05-19T20:00:00Z"),
          price: 94,
          expMovingAvgForStock: 90
        },
        {
          stock: "DEF",
          date: new Date("2020-05-20T20:00:00Z"),
          price: 112,
          expMovingAvgForStock: 104.66666666666666
        },
        {
          stock: "DEF",
          date: new Date("2020-05-21T20:00:00Z"),
          price: 97.3,
          expMovingAvgForStock: 99.75555555555556
        }
      ]);
    });

    it("Exponential Moving Average Using alpha", () => {
      const result = aggregate(
        data,
        [
          {
            $setWindowFields: {
              partitionBy: "$stock",
              sortBy: { date: 1 },
              output: {
                expMovingAvgForStock: {
                  $expMovingAvg: { input: "$price", alpha: 0.75 }
                }
              }
            }
          }
        ],
        options
      );

      expect(result).toStrictEqual([
        {
          stock: "ABC",
          date: new Date("2020-05-18T20:00:00Z"),
          price: 13,
          expMovingAvgForStock: 13
        },
        {
          stock: "ABC",
          date: new Date("2020-05-19T20:00:00Z"),
          price: 15.4,
          expMovingAvgForStock: 14.8
        },
        {
          stock: "ABC",
          date: new Date("2020-05-20T20:00:00Z"),
          price: 12,
          expMovingAvgForStock: 12.7
        },
        {
          stock: "ABC",
          date: new Date("2020-05-21T20:00:00Z"),
          price: 11.7,
          expMovingAvgForStock: 11.95
        },
        {
          stock: "DEF",
          date: new Date("2020-05-18T20:00:00Z"),
          price: 82,
          expMovingAvgForStock: 82
        },
        {
          stock: "DEF",
          date: new Date("2020-05-19T20:00:00Z"),
          price: 94,
          expMovingAvgForStock: 91
        },
        {
          stock: "DEF",
          date: new Date("2020-05-20T20:00:00Z"),
          price: 112,
          expMovingAvgForStock: 106.75
        },
        {
          stock: "DEF",
          date: new Date("2020-05-21T20:00:00Z"),
          price: 97.3,
          expMovingAvgForStock: 99.6625
        }
      ]);
    });
  });
});
