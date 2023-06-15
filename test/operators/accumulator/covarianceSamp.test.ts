import { aggregate } from "../../../src";
import { DEFAULT_OPTS } from "../../support";

describe("operators/accumulator/covarianceSamp", () => {
  it("$covarianceSamp", () => {
    const result = aggregate(
      [
        {
          _id: 0,
          type: "chocolate",
          orderDate: new Date("2020-05-18T14:10:30Z"),
          state: "CA",
          price: 13,
          quantity: 120
        },
        {
          _id: 1,
          type: "chocolate",
          orderDate: new Date("2021-03-20T11:30:05Z"),
          state: "WA",
          price: 14,
          quantity: 140
        },
        {
          _id: 2,
          type: "vanilla",
          orderDate: new Date("2021-01-11T06:31:15Z"),
          state: "CA",
          price: 12,
          quantity: 145
        },
        {
          _id: 3,
          type: "vanilla",
          orderDate: new Date("2020-02-08T13:13:23Z"),
          state: "WA",
          price: 13,
          quantity: 104
        },
        {
          _id: 4,
          type: "strawberry",
          orderDate: new Date("2019-05-18T16:09:01Z"),
          state: "CA",
          price: 41,
          quantity: 162
        },
        {
          _id: 5,
          type: "strawberry",
          orderDate: new Date("2019-01-08T06:12:03Z"),
          state: "WA",
          price: 43,
          quantity: 134
        }
      ],
      [
        {
          $setWindowFields: {
            partitionBy: "$state",
            sortBy: { orderDate: 1 },
            output: {
              covarianceSampForState: {
                $covarianceSamp: [{ $year: "$orderDate" }, "$quantity"],
                window: {
                  documents: ["unbounded", "current"]
                }
              }
            }
          }
        }
      ],
      DEFAULT_OPTS
    );

    expect(result).toEqual([
      {
        _id: 5,
        type: "strawberry",
        orderDate: new Date("2019-01-08T06:12:03Z"),
        state: "WA",
        price: 43,
        quantity: 134,
        covarianceSampForState: null
      },
      {
        _id: 3,
        type: "vanilla",
        orderDate: new Date("2020-02-08T13:13:23Z"),
        state: "WA",
        price: 13,
        quantity: 104,
        covarianceSampForState: -15
      },
      {
        _id: 1,
        type: "chocolate",
        orderDate: new Date("2021-03-20T11:30:05Z"),
        state: "WA",
        price: 14,
        quantity: 140,
        covarianceSampForState: 3
      },
      {
        _id: 4,
        type: "strawberry",
        orderDate: new Date("2019-05-18T16:09:01Z"),
        state: "CA",
        price: 41,
        quantity: 162,
        covarianceSampForState: null
      },
      {
        _id: 0,
        type: "chocolate",
        orderDate: new Date("2020-05-18T14:10:30Z"),
        state: "CA",
        price: 13,
        quantity: 120,
        covarianceSampForState: -21
      },
      {
        _id: 2,
        type: "vanilla",
        orderDate: new Date("2021-01-11T06:31:15Z"),
        state: "CA",
        price: 12,
        quantity: 145,
        covarianceSampForState: -8.5 //-8.500000000000007,
      }
    ]);
  });
});
