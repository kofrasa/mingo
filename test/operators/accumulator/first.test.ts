import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { ISODate, testPath } from "../../support";

describe(testPath(import.meta.url), () => {
  it("use in $group stage", () => {
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
        { $group: { _id: "$item", firstSale: { $first: "$date" } } }
      ]
    );
    expect(res).toEqual([
      { _id: "abc", firstSale: ISODate("2014-01-01T08:00:00.000Z") },
      { _id: "jkl", firstSale: ISODate("2014-02-03T09:00:00.000Z") },
      { _id: "xyz", firstSale: ISODate("2014-02-03T09:05:00.000Z") }
    ]);
  });

  it("should handle missing data", () => {
    const res = aggregate(
      [
        { _id: 1, price: 6, quantity: 6 },
        { _id: 2, item: "album", price: 5, quantity: 5 },
        { _id: 7, item: "tape", price: 6, quantity: 6 },
        { _id: 8, price: 5, quantity: 5 },
        { _id: 9, item: "album", price: 3, quantity: "" },
        { _id: 10, item: "tape", price: 3, quantity: 4 },
        { _id: 12, item: "cd", price: 7 }
      ],
      [
        { $sort: { item: 1, price: 1 } },
        { $group: { _id: "$item", inStock: { $first: "$quantity" } } }
      ]
    );
    expect(res).toEqual([
      { _id: null, inStock: 5 },
      { _id: "album", inStock: "" },
      { _id: "cd", inStock: null },
      { _id: "tape", inStock: 4 }
    ]);
  });
});
