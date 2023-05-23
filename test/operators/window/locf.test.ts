import "../../../src/init/system";

import { aggregate } from "../../../src";
import { initOptions, ProcessingMode } from "../../../src/core";

const options = initOptions({ processingMode: ProcessingMode.CLONE_INPUT });

describe("operators/window/locf", () => {
  describe("$locf", () => {
    it("Fill Missing Values with the Last Observed Value", () => {
      const result = aggregate(
        [
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
        ],
        [
          {
            $setWindowFields: {
              sortBy: { time: 1 },
              output: {
                price: { $locf: "$price" }
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
          price: 500
        },
        {
          time: new Date("2021-03-08T11:00:00.000Z"),
          price: 515
        },
        {
          time: new Date("2021-03-08T12:00:00.000Z"),
          price: 515
        },
        {
          time: new Date("2021-03-08T13:00:00.000Z"),
          price: 515
        },
        {
          time: new Date("2021-03-08T14:00:00.000Z"),
          price: 485
        }
      ]);
    });
  });
});
