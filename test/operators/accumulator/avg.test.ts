import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { ISODate, testPath } from "../../support";

describe(testPath(import.meta.url), () => {
  it("returns null for empty set", () => {
    const res = aggregate(
      [
        { _id: 1, item: "abc", price: "10", quantity: 2 },
        { _id: 2, item: "def", price: null, quantity: 5 },
        { _id: 3, item: "ghi", quantity: 1 }
      ],
      [
        {
          $group: {
            _id: null,
            avgPrice: { $avg: "$price" },
            avgQuantity: { $avg: "$quantity" }
          }
        }
      ]
    );

    expect(res).toEqual([
      {
        _id: null,
        avgPrice: null,
        avgQuantity: 8 / 3
      }
    ]);
  });

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
          date: ISODate("2014-02-15T09:12:00Z")
        }
      ],
      [
        {
          $group: {
            _id: "$item",
            avgAmount: { $avg: { $multiply: ["$price", "$quantity"] } },
            avgQuantity: { $avg: "$quantity" }
          }
        }
      ]
    );

    expect(res).toEqual([
      { _id: "abc", avgAmount: 60, avgQuantity: 6 },
      { _id: "jkl", avgAmount: 20, avgQuantity: 1 },
      { _id: "xyz", avgAmount: 37.5, avgQuantity: 7.5 }
    ]);
  });

  it("use in $project stage", () => {
    const res = aggregate(
      [
        { _id: 1, quizzes: [10, 6, 7], labs: [5, 8], final: 80, midterm: 75 },
        { _id: 2, quizzes: [9, 10], labs: [8, 8], final: 95, midterm: 80 },
        { _id: 3, quizzes: [4, 5, 5], labs: [6, 5], final: 78, midterm: 70 }
      ],
      [
        {
          $project: {
            quizAvg: { $avg: "$quizzes" },
            labAvg: { $avg: "$labs" },
            examAvg: { $avg: ["$final", "$midterm"] }
          }
        }
      ]
    );

    expect(res).toEqual([
      { _id: 1, quizAvg: 7.666666666666667, labAvg: 6.5, examAvg: 77.5 },
      { _id: 2, quizAvg: 9.5, labAvg: 8, examAvg: 87.5 },
      { _id: 3, quizAvg: 4.666666666666667, labAvg: 5.5, examAvg: 74 }
    ]);
  });

  // it("can compute average with $avg", () => {
  //   const res = aggregate(
  //     [
  //       { _id: 1, item: "abc", price: 10, quantity: 2 },
  //       { _id: 2, item: "def", price: 5, quantity: 5 },
  //       { _id: 3, item: "ghi", price: 15, quantity: 1 }
  //     ],
  //     [
  //       {
  //         $group: {
  //           _id: null,
  //           avgPrice: { $avg: "$price" },
  //           avgQuantity: { $avg: "$quantity" }
  //         }
  //       }
  //     ]
  //   );

  //   expect(res).toEqual([
  //     {
  //       _id: null,
  //       avgPrice: 10,
  //       avgQuantity: 8 / 3
  //     }
  //   ]);
  // });
});
