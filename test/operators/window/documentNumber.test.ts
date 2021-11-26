import "../../../src/init/system";

import { aggregate } from "../../../src";
import { ProcessingMode } from "../../../src/core";

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

describe("operators/window/documentNumber", () => {
  describe("$documentNumber", () => {
    it("Document Number for Each State", () => {
      const result = aggregate(
        data,
        [
          {
            $setWindowFields: {
              partitionBy: "$state",
              sortBy: { quantity: -1 },
              output: {
                documentNumberForState: {
                  $documentNumber: {},
                },
              },
            },
          },
        ],
        options
      );

      expect(result).toStrictEqual([
        {
          _id: 4,
          type: "strawberry",
          orderDate: new Date("2019-05-18T16:09:01Z"),
          state: "CA",
          price: 41,
          quantity: 162,
          documentNumberForState: 1,
        },
        {
          _id: 2,
          type: "vanilla",
          orderDate: new Date("2021-01-11T06:31:15Z"),
          state: "CA",
          price: 12,
          quantity: 145,
          documentNumberForState: 2,
        },
        {
          _id: 0,
          type: "chocolate",
          orderDate: new Date("2020-05-18T14:10:30Z"),
          state: "CA",
          price: 13,
          quantity: 120,
          documentNumberForState: 3,
        },
        {
          _id: 1,
          type: "chocolate",
          orderDate: new Date("2021-03-20T11:30:05Z"),
          state: "WA",
          price: 14,
          quantity: 140,
          documentNumberForState: 1,
        },
        {
          _id: 5,
          type: "strawberry",
          orderDate: new Date("2019-01-08T06:12:03Z"),
          state: "WA",
          price: 43,
          quantity: 134,
          documentNumberForState: 2,
        },
        {
          _id: 3,
          type: "vanilla",
          orderDate: new Date("2020-02-08T13:13:23Z"),
          state: "WA",
          price: 13,
          quantity: 104,
          documentNumberForState: 3,
        },
      ]);
    });

    it("Document Number for Duplicate, Null, and Missing Values", () => {
      const result = aggregate(
        [
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
          {
            _id: 6,
            type: "strawberry",
            orderDate: new Date("2020-01-08T06:12:03Z"),
            state: "WA",
            price: 41,
            quantity: 134,
          },
          {
            _id: 7,
            type: "strawberry",
            orderDate: new Date("2020-01-01T06:12:03Z"),
            state: "WA",
            price: 34,
            quantity: 134,
          },
          {
            _id: 8,
            type: "strawberry",
            orderDate: new Date("2020-01-02T06:12:03Z"),
            state: "WA",
            price: 40,
            quantity: 134,
          },
          {
            _id: 9,
            type: "strawberry",
            orderDate: new Date("2020-05-11T16:09:01Z"),
            state: "CA",
            price: 39,
            quantity: 162,
          },
          {
            _id: 10,
            type: "strawberry",
            orderDate: new Date("2020-05-11T16:09:01Z"),
            state: "CA",
            price: 39,
            quantity: null,
          },
          {
            _id: 11,
            type: "strawberry",
            orderDate: new Date("2020-05-11T16:09:01Z"),
            state: "CA",
            price: 39,
          },
        ],
        [
          {
            $setWindowFields: {
              partitionBy: "$state",
              sortBy: { quantity: -1 },
              output: {
                documentNumberForState: {
                  $documentNumber: {},
                },
              },
            },
          },
        ],
        options
      );

      expect(result).toStrictEqual([
        {
          _id: 4,
          type: "strawberry",
          orderDate: new Date("2019-05-18T16:09:01Z"),
          state: "CA",
          price: 41,
          quantity: 162,
          documentNumberForState: 1,
        },
        {
          _id: 9,
          type: "strawberry",
          orderDate: new Date("2020-05-11T16:09:01Z"),
          state: "CA",
          price: 39,
          quantity: 162,
          documentNumberForState: 2,
        },
        {
          _id: 2,
          type: "vanilla",
          orderDate: new Date("2021-01-11T06:31:15Z"),
          state: "CA",
          price: 12,
          quantity: 145,
          documentNumberForState: 3,
        },
        {
          _id: 0,
          type: "chocolate",
          orderDate: new Date("2020-05-18T14:10:30Z"),
          state: "CA",
          price: 13,
          quantity: 120,
          documentNumberForState: 4,
        },
        {
          _id: 10,
          type: "strawberry",
          orderDate: new Date("2020-05-11T16:09:01Z"),
          state: "CA",
          price: 39,
          quantity: null,
          documentNumberForState: 5,
        },
        {
          _id: 11,
          type: "strawberry",
          orderDate: new Date("2020-05-11T16:09:01Z"),
          state: "CA",
          price: 39,
          documentNumberForState: 6,
        },
        {
          _id: 1,
          type: "chocolate",
          orderDate: new Date("2021-03-20T11:30:05Z"),
          state: "WA",
          price: 14,
          quantity: 140,
          documentNumberForState: 1,
        },
        {
          _id: 5,
          type: "strawberry",
          orderDate: new Date("2019-01-08T06:12:03Z"),
          state: "WA",
          price: 43,
          quantity: 134,
          documentNumberForState: 2,
        },
        {
          _id: 6,
          type: "strawberry",
          orderDate: new Date("2020-01-08T06:12:03Z"),
          state: "WA",
          price: 41,
          quantity: 134,
          documentNumberForState: 3,
        },
        {
          _id: 7,
          type: "strawberry",
          orderDate: new Date("2020-01-01T06:12:03Z"),
          state: "WA",
          price: 34,
          quantity: 134,
          documentNumberForState: 4,
        },
        {
          _id: 8,
          type: "strawberry",
          orderDate: new Date("2020-01-02T06:12:03Z"),
          state: "WA",
          price: 40,
          quantity: 134,
          documentNumberForState: 5,
        },
        {
          _id: 3,
          type: "vanilla",
          orderDate: new Date("2020-02-08T13:13:23Z"),
          state: "WA",
          price: 13,
          quantity: 104,
          documentNumberForState: 6,
        },
      ]);
    });
  });
});
