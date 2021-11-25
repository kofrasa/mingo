import "../../../src/init/system";

import { aggregate } from "../../../src";
import { ProcessingMode } from "../../../src/core";

describe("operators/pipeline/setWindowFields", () => {
  describe("$setWindowFields", () => {
    const options = { processingMode: ProcessingMode.CLONE_INPUT };
    const data = [
      {
        _id: 0,
        type: "chocolate",
        orderDate: new Date("2020-05-18T14:10:30Z"),
        state: "CA",
        price: 13,
        quantity: 120,
      },
      {
        _id: 1,
        type: "chocolate",
        orderDate: new Date("2021-03-20T11:30:05Z"),
        state: "WA",
        price: 14,
        quantity: 140,
      },
      {
        _id: 2,
        type: "vanilla",
        orderDate: new Date("2021-01-11T06:31:15Z"),
        state: "CA",
        price: 12,
        quantity: 145,
      },
      {
        _id: 3,
        type: "vanilla",
        orderDate: new Date("2020-02-08T13:13:23Z"),
        state: "WA",
        price: 13,
        quantity: 104,
      },
      {
        _id: 4,
        type: "strawberry",
        orderDate: new Date("2019-05-18T16:09:01Z"),
        state: "CA",
        price: 41,
        quantity: 162,
      },
      {
        _id: 5,
        type: "strawberry",
        orderDate: new Date("2019-01-08T06:12:03Z"),
        state: "WA",
        price: 43,
        quantity: 134,
      },
    ];

    it("Use Documents Window to Obtain Cumulative Quantity for Each State", () => {
      const result = aggregate(
        data,
        [
          {
            $setWindowFields: {
              partitionBy: "$state",
              sortBy: { orderDate: 1 },
              output: {
                cumulativeQuantityForState: {
                  $sum: "$quantity",
                  window: {
                    documents: ["unbounded", "current"],
                  },
                },
              },
            },
          },
        ],
        options
      );

      expect(result).toStrictEqual([
        {
          _id: 5,
          type: "strawberry",
          orderDate: new Date("2019-01-08T06:12:03Z"),
          state: "WA",
          price: 43,
          quantity: 134,
          cumulativeQuantityForState: 134,
        },
        {
          _id: 3,
          type: "vanilla",
          orderDate: new Date("2020-02-08T13:13:23Z"),
          state: "WA",
          price: 13,
          quantity: 104,
          cumulativeQuantityForState: 238,
        },
        {
          _id: 1,
          type: "chocolate",
          orderDate: new Date("2021-03-20T11:30:05Z"),
          state: "WA",
          price: 14,
          quantity: 140,
          cumulativeQuantityForState: 378,
        },
        {
          _id: 4,
          type: "strawberry",
          orderDate: new Date("2019-05-18T16:09:01Z"),
          state: "CA",
          price: 41,
          quantity: 162,
          cumulativeQuantityForState: 162,
        },
        {
          _id: 0,
          type: "chocolate",
          orderDate: new Date("2020-05-18T14:10:30Z"),
          state: "CA",
          price: 13,
          quantity: 120,
          cumulativeQuantityForState: 282,
        },
        {
          _id: 2,
          type: "vanilla",
          orderDate: new Date("2021-01-11T06:31:15Z"),
          state: "CA",
          price: 12,
          quantity: 145,
          cumulativeQuantityForState: 427,
        },
      ]);
    });

    it("Use Documents Window to Obtain Cumulative Quantity for Each Year", () => {
      const result = aggregate(
        data,
        [
          {
            $setWindowFields: {
              partitionBy: { $year: "$orderDate" },
              sortBy: { orderDate: 1 },
              output: {
                cumulativeQuantityForYear: {
                  $sum: "$quantity",
                  window: {
                    documents: ["unbounded", "current"],
                  },
                },
              },
            },
          },
        ],
        options
      );

      expect(result).toStrictEqual([
        {
          _id: 5,
          type: "strawberry",
          orderDate: new Date("2019-01-08T06:12:03Z"),
          state: "WA",
          price: 43,
          quantity: 134,
          cumulativeQuantityForYear: 134,
        },
        {
          _id: 4,
          type: "strawberry",
          orderDate: new Date("2019-05-18T16:09:01Z"),
          state: "CA",
          price: 41,
          quantity: 162,
          cumulativeQuantityForYear: 296,
        },
        {
          _id: 3,
          type: "vanilla",
          orderDate: new Date("2020-02-08T13:13:23Z"),
          state: "WA",
          price: 13,
          quantity: 104,
          cumulativeQuantityForYear: 104,
        },
        {
          _id: 0,
          type: "chocolate",
          orderDate: new Date("2020-05-18T14:10:30Z"),
          state: "CA",
          price: 13,
          quantity: 120,
          cumulativeQuantityForYear: 224,
        },
        {
          _id: 2,
          type: "vanilla",
          orderDate: new Date("2021-01-11T06:31:15Z"),
          state: "CA",
          price: 12,
          quantity: 145,
          cumulativeQuantityForYear: 145,
        },
        {
          _id: 1,
          type: "chocolate",
          orderDate: new Date("2021-03-20T11:30:05Z"),
          state: "WA",
          price: 14,
          quantity: 140,
          cumulativeQuantityForYear: 285,
        },
      ]);
    });

    it("Use Documents Window to Obtain Moving Average Quantity for Each Year", () => {
      const result = aggregate(
        data,
        [
          {
            $setWindowFields: {
              partitionBy: { $year: "$orderDate" },
              sortBy: { orderDate: 1 },
              output: {
                averageQuantity: {
                  $avg: "$quantity",
                  window: {
                    documents: [-1, 0],
                  },
                },
              },
            },
          },
        ],
        options
      );

      expect(result).toStrictEqual([
        {
          _id: 5,
          type: "strawberry",
          orderDate: new Date("2019-01-08T06:12:03Z"),
          state: "WA",
          price: 43,
          quantity: 134,
          averageQuantity: 134,
        },
        {
          _id: 4,
          type: "strawberry",
          orderDate: new Date("2019-05-18T16:09:01Z"),
          state: "CA",
          price: 41,
          quantity: 162,
          averageQuantity: 148,
        },
        {
          _id: 3,
          type: "vanilla",
          orderDate: new Date("2020-02-08T13:13:23Z"),
          state: "WA",
          price: 13,
          quantity: 104,
          averageQuantity: 104,
        },
        {
          _id: 0,
          type: "chocolate",
          orderDate: new Date("2020-05-18T14:10:30Z"),
          state: "CA",
          price: 13,
          quantity: 120,
          averageQuantity: 112,
        },
        {
          _id: 2,
          type: "vanilla",
          orderDate: new Date("2021-01-11T06:31:15Z"),
          state: "CA",
          price: 12,
          quantity: 145,
          averageQuantity: 145,
        },
        {
          _id: 1,
          type: "chocolate",
          orderDate: new Date("2021-03-20T11:30:05Z"),
          state: "WA",
          price: 14,
          quantity: 140,
          averageQuantity: 142.5,
        },
      ]);
    });

    it("Use Documents Window to Obtain Cumulative and Maximum Quantity for Each Year", () => {
      const result = aggregate(
        data,
        [
          {
            $setWindowFields: {
              partitionBy: { $year: "$orderDate" },
              sortBy: { orderDate: 1 },
              output: {
                cumulativeQuantityForYear: {
                  $sum: "$quantity",
                  window: {
                    documents: ["unbounded", "current"],
                  },
                },
                maximumQuantityForYear: {
                  $max: "$quantity",
                  window: {
                    documents: ["unbounded", "unbounded"],
                  },
                },
              },
            },
          },
        ],
        options
      );

      expect(result).toStrictEqual([
        {
          _id: 5,
          type: "strawberry",
          orderDate: new Date("2019-01-08T06:12:03Z"),
          state: "WA",
          price: 43,
          quantity: 134,
          cumulativeQuantityForYear: 134,
          maximumQuantityForYear: 162,
        },
        {
          _id: 4,
          type: "strawberry",
          orderDate: new Date("2019-05-18T16:09:01Z"),
          state: "CA",
          price: 41,
          quantity: 162,
          cumulativeQuantityForYear: 296,
          maximumQuantityForYear: 162,
        },
        {
          _id: 3,
          type: "vanilla",
          orderDate: new Date("2020-02-08T13:13:23Z"),
          state: "WA",
          price: 13,
          quantity: 104,
          cumulativeQuantityForYear: 104,
          maximumQuantityForYear: 120,
        },
        {
          _id: 0,
          type: "chocolate",
          orderDate: new Date("2020-05-18T14:10:30Z"),
          state: "CA",
          price: 13,
          quantity: 120,
          cumulativeQuantityForYear: 224,
          maximumQuantityForYear: 120,
        },
        {
          _id: 2,
          type: "vanilla",
          orderDate: new Date("2021-01-11T06:31:15Z"),
          state: "CA",
          price: 12,
          quantity: 145,
          cumulativeQuantityForYear: 145,
          maximumQuantityForYear: 145,
        },
        {
          _id: 1,
          type: "chocolate",
          orderDate: new Date("2021-03-20T11:30:05Z"),
          state: "WA",
          price: 14,
          quantity: 140,
          cumulativeQuantityForYear: 285,
          maximumQuantityForYear: 145,
        },
      ]);
    });

    it("Range Window Example", () => {
      const result = aggregate(
        data,
        [
          {
            $setWindowFields: {
              partitionBy: "$state",
              sortBy: { price: 1 },
              output: {
                quantityFromSimilarOrders: {
                  $sum: "$quantity",
                  window: {
                    range: [-10, 10],
                  },
                },
              },
            },
          },
        ],
        options
      );

      expect(result).toStrictEqual([
        {
          _id: 2,
          type: "vanilla",
          orderDate: new Date("2021-01-11T06:31:15Z"),
          state: "CA",
          price: 12,
          quantity: 145,
          quantityFromSimilarOrders: 265,
        },
        {
          _id: 0,
          type: "chocolate",
          orderDate: new Date("2020-05-18T14:10:30Z"),
          state: "CA",
          price: 13,
          quantity: 120,
          quantityFromSimilarOrders: 265,
        },
        {
          _id: 4,
          type: "strawberry",
          orderDate: new Date("2019-05-18T16:09:01Z"),
          state: "CA",
          price: 41,
          quantity: 162,
          quantityFromSimilarOrders: 162,
        },
        {
          _id: 3,
          type: "vanilla",
          orderDate: new Date("2020-02-08T13:13:23Z"),
          state: "WA",
          price: 13,
          quantity: 104,
          quantityFromSimilarOrders: 244,
        },
        {
          _id: 1,
          type: "chocolate",
          orderDate: new Date("2021-03-20T11:30:05Z"),
          state: "WA",
          price: 14,
          quantity: 140,
          quantityFromSimilarOrders: 244,
        },
        {
          _id: 5,
          type: "strawberry",
          orderDate: new Date("2019-01-08T06:12:03Z"),
          state: "WA",
          price: 43,
          quantity: 134,
          quantityFromSimilarOrders: 134,
        },
      ]);
    });

    describe("Time Range Window Examples", () => {
      it("Use a Time Range Window with a Positive Upper Bound", () => {
        const result = aggregate(
          data,
          [
            {
              $setWindowFields: {
                partitionBy: "$state",
                sortBy: { orderDate: 1 },
                output: {
                  recentOrders: {
                    $push: "$orderDate",
                    window: {
                      range: ["unbounded", 10],
                      unit: "month",
                    },
                  },
                },
              },
            },
          ],
          options
        );

        expect(result).toStrictEqual([
          {
            _id: 5,
            type: "strawberry",
            orderDate: new Date("2019-01-08T06:12:03Z"),
            state: "WA",
            price: 43,
            quantity: 134,
            recentOrders: [new Date("2019-01-08T06:12:03Z")],
          },
          {
            _id: 3,
            type: "vanilla",
            orderDate: new Date("2020-02-08T13:13:23Z"),
            state: "WA",
            price: 13,
            quantity: 104,
            recentOrders: [
              new Date("2019-01-08T06:12:03Z"),
              new Date("2020-02-08T13:13:23Z"),
            ],
          },
          {
            _id: 1,
            type: "chocolate",
            orderDate: new Date("2021-03-20T11:30:05Z"),
            state: "WA",
            price: 14,
            quantity: 140,
            recentOrders: [
              new Date("2019-01-08T06:12:03Z"),
              new Date("2020-02-08T13:13:23Z"),
              new Date("2021-03-20T11:30:05Z"),
            ],
          },
          {
            _id: 4,
            type: "strawberry",
            orderDate: new Date("2019-05-18T16:09:01Z"),
            state: "CA",
            price: 41,
            quantity: 162,
            recentOrders: [new Date("2019-05-18T16:09:01Z")],
          },
          {
            _id: 0,
            type: "chocolate",
            orderDate: new Date("2020-05-18T14:10:30Z"),
            state: "CA",
            price: 13,
            quantity: 120,
            recentOrders: [
              new Date("2019-05-18T16:09:01Z"),
              new Date("2020-05-18T14:10:30Z"),
              new Date("2021-01-11T06:31:15Z"),
            ],
          },
          {
            _id: 2,
            type: "vanilla",
            orderDate: new Date("2021-01-11T06:31:15Z"),
            state: "CA",
            price: 12,
            quantity: 145,
            recentOrders: [
              new Date("2019-05-18T16:09:01Z"),
              new Date("2020-05-18T14:10:30Z"),
              new Date("2021-01-11T06:31:15Z"),
            ],
          },
        ]);
      });

      it("Use a Time Range Window with a Negative Upper Bound", () => {
        const result = aggregate(
          data,
          [
            {
              $setWindowFields: {
                partitionBy: "$state",
                sortBy: { orderDate: 1 },
                output: {
                  recentOrders: {
                    $push: "$orderDate",
                    window: {
                      range: ["unbounded", -10],
                      unit: "month",
                    },
                  },
                },
              },
            },
          ],
          options
        );

        expect(result).toStrictEqual([
          {
            _id: 5,
            type: "strawberry",
            orderDate: new Date("2019-01-08T06:12:03Z"),
            state: "WA",
            price: 43,
            quantity: 134,
            recentOrders: [],
          },
          {
            _id: 3,
            type: "vanilla",
            orderDate: new Date("2020-02-08T13:13:23Z"),
            state: "WA",
            price: 13,
            quantity: 104,
            recentOrders: [new Date("2019-01-08T06:12:03Z")],
          },
          {
            _id: 1,
            type: "chocolate",
            orderDate: new Date("2021-03-20T11:30:05Z"),
            state: "WA",
            price: 14,
            quantity: 140,
            recentOrders: [
              new Date("2019-01-08T06:12:03Z"),
              new Date("2020-02-08T13:13:23Z"),
            ],
          },
          {
            _id: 4,
            type: "strawberry",
            orderDate: new Date("2019-05-18T16:09:01Z"),
            state: "CA",
            price: 41,
            quantity: 162,
            recentOrders: [],
          },
          {
            _id: 0,
            type: "chocolate",
            orderDate: new Date("2020-05-18T14:10:30Z"),
            state: "CA",
            price: 13,
            quantity: 120,
            recentOrders: [new Date("2019-05-18T16:09:01Z")],
          },
          {
            _id: 2,
            type: "vanilla",
            orderDate: new Date("2021-01-11T06:31:15Z"),
            state: "CA",
            price: 12,
            quantity: 145,
            recentOrders: [new Date("2019-05-18T16:09:01Z")],
          },
        ]);
      });
    });
  });
});
