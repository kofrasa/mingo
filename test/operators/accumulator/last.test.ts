import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { ISODate, testPath } from "../../support";

describe(testPath(import.meta.url), () => {
  it("Use in $group Stage", () => {
    const res = aggregate(
      [
        {
          _id: 1,
          item: "abc",
          price: 10,
          quantity: 2,
          date: ISODate("2014-01-01T08:00:00Z")
        },
        {
          _id: 2,
          item: "jkl",
          price: 20,
          quantity: 1,
          date: ISODate("2014-02-03T09:00:00Z")
        },
        {
          _id: 3,
          item: "xyz",
          price: 5,
          quantity: 5,
          date: ISODate("2014-02-03T09:05:00Z")
        },
        {
          _id: 4,
          item: "abc",
          price: 10,
          quantity: 10,
          date: ISODate("2014-02-15T08:00:00Z")
        },
        {
          _id: 5,
          item: "xyz",
          price: 5,
          quantity: 10,
          date: ISODate("2014-02-15T09:05:00Z")
        },
        {
          _id: 6,
          item: "xyz",
          price: 5,
          quantity: 5,
          date: ISODate("2014-02-15T12:05:10Z")
        },
        {
          _id: 7,
          item: "xyz",
          price: 5,
          quantity: 10,
          date: ISODate("2014-02-15T14:12:12Z")
        }
      ],
      [
        { $sort: { item: 1, date: 1 } },
        { $group: { _id: "$item", lastSalesDate: { $last: "$date" } } }
      ]
    );
    expect(res).toEqual([
      { _id: "abc", lastSalesDate: ISODate("2014-02-15T08:00:00Z") },
      { _id: "jkl", lastSalesDate: ISODate("2014-02-03T09:00:00Z") },
      { _id: "xyz", lastSalesDate: ISODate("2014-02-15T14:12:12Z") }
    ]);
  });

  it("Returns null if no input is given", () => {
    const res = aggregate(
      [
        { _id: 1, item: "abc" },
        { _id: 2, item: "jkl" }
      ],
      [{ $group: { _id: "$item", last: { $last: "$date" } } }]
    );
    expect(res).toEqual([
      { _id: "abc", last: null },
      { _id: "jkl", last: null }
    ]);
  });

  it("Use in $setWindowFields Stage", () => {
    const res = aggregate(
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
              lastOrderTypeForState: {
                $last: "$type",
                window: { documents: ["current", "unbounded"] }
              }
            }
          }
        }
      ]
    );
    expect(res).toEqual([
      {
        _id: 5,
        type: "strawberry",
        orderDate: ISODate("2019-01-08T06:12:03Z"),
        state: "WA",
        price: 43,
        quantity: 134,
        lastOrderTypeForState: "chocolate"
      },
      {
        _id: 3,
        type: "vanilla",
        orderDate: ISODate("2020-02-08T13:13:23Z"),
        state: "WA",
        price: 13,
        quantity: 104,
        lastOrderTypeForState: "chocolate"
      },
      {
        _id: 1,
        type: "chocolate",
        orderDate: ISODate("2021-03-20T11:30:05Z"),
        state: "WA",
        price: 14,
        quantity: 140,
        lastOrderTypeForState: "chocolate"
      },
      {
        _id: 4,
        type: "strawberry",
        orderDate: ISODate("2019-05-18T16:09:01Z"),
        state: "CA",
        price: 41,
        quantity: 162,
        lastOrderTypeForState: "vanilla"
      },
      {
        _id: 0,
        type: "chocolate",
        orderDate: ISODate("2020-05-18T14:10:30Z"),
        state: "CA",
        price: 13,
        quantity: 120,
        lastOrderTypeForState: "vanilla"
      },
      {
        _id: 2,
        type: "vanilla",
        orderDate: ISODate("2021-01-11T06:31:15Z"),
        state: "CA",
        price: 12,
        quantity: 145,
        lastOrderTypeForState: "vanilla"
      }
    ]);
  });
});
