import "../../../src/init/system";

import { aggregate } from "../../../src";
import { initOptions, ProcessingMode } from "../../../src/core";

const options = initOptions({ processingMode: ProcessingMode.CLONE_INPUT });

const data = [
  {
    time: new Date("2021-03-08T09:00:00.000Z"),
    price: 500
  },
  {
    time: new Date("2021-03-08T10:00:00.000Z")
  },
  {
    time: new Date("2021-03-08T11:00:00.000Z"),
    price: 515
  },
  {
    time: new Date("2021-03-08T12:00:00.000Z")
  },
  {
    time: new Date("2021-03-08T13:00:00.000Z")
  },
  {
    time: new Date("2021-03-08T14:00:00.000Z"),
    price: 485
  }
];

describe("operators/window/linearFill", () => {
  describe("$linearFill", () => {
    it("Fills Missing Contiguous Vales", () => {
      const result = aggregate(
        [
          { index: 0, value: 0 },
          { index: 1, value: null },
          { index: 2, value: null },
          { index: 3, value: null },
          { index: 4, value: 10 }
        ],
        [
          {
            $setWindowFields: {
              sortBy: { index: 1 },
              output: {
                value: { $linearFill: "$value" }
              }
            }
          }
        ]
      );

      expect(result).toEqual([
        { index: 0, value: 0 },
        { index: 1, value: 2.5 },
        { index: 2, value: 5 },
        { index: 3, value: 7.5 },
        { index: 4, value: 10 }
      ]);
    });

    it("Fill Missing Values with Linear Interpolation", () => {
      const result = aggregate(
        data,
        [
          {
            $setWindowFields: {
              sortBy: { time: 1 },
              output: {
                price: { $linearFill: "$price" }
              }
            }
          }
        ],
        options
      );

      expect(result).toEqual([
        {
          time: new Date("2021-03-08T09:00:00.000Z"),
          price: 500
        },
        {
          time: new Date("2021-03-08T10:00:00.000Z"),
          price: 507.5
        },
        {
          time: new Date("2021-03-08T11:00:00.000Z"),
          price: 515
        },
        {
          time: new Date("2021-03-08T12:00:00.000Z"),
          price: 505
        },
        {
          time: new Date("2021-03-08T13:00:00.000Z"),
          price: 495
        },
        {
          time: new Date("2021-03-08T14:00:00.000Z"),
          price: 485
        }
      ]);
    });

    it("Use Multiple Fill Methods in a Single Stage", () => {
      const result = aggregate(
        data,
        [
          {
            $setWindowFields: {
              sortBy: { time: 1 },
              output: {
                linearFillPrice: { $linearFill: "$price" },
                locfPrice: { $locf: "$price" }
              }
            }
          }
        ],
        options
      );

      expect(result).toEqual([
        {
          time: new Date("2021-03-08T09:00:00.000Z"),
          price: 500,
          linearFillPrice: 500,
          locfPrice: 500
        },
        {
          time: new Date("2021-03-08T10:00:00.000Z"),
          linearFillPrice: 507.5,
          locfPrice: 500
        },
        {
          time: new Date("2021-03-08T11:00:00.000Z"),
          price: 515,
          linearFillPrice: 515,
          locfPrice: 515
        },
        {
          time: new Date("2021-03-08T12:00:00.000Z"),
          linearFillPrice: 505,
          locfPrice: 515
        },
        {
          time: new Date("2021-03-08T13:00:00.000Z"),
          linearFillPrice: 495,
          locfPrice: 515
        },
        {
          time: new Date("2021-03-08T14:00:00.000Z"),
          price: 485,
          linearFillPrice: 485,
          locfPrice: 485
        }
      ]);
    });
  });
});
