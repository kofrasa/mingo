import test from "tape";

import { aggregate } from "../../src";
import * as support from "../support";

support.runTest("Object expression: $mergeObjects", {
  $mergeObjects: [
    [{ $mergeObjects: [{ a: 1 }, null] }, { a: 1 }],
    [{ $mergeObjects: [null, null] }, {}],
    [
      {
        $mergeObjects: [{ a: 1 }, { a: 2, b: 2 }, { a: 3, c: 3 }],
      },
      { a: 3, b: 2, c: 3 },
    ],
    [
      {
        $mergeObjects: [{ a: 1 }, { a: 2, b: 2 }, { a: 3, b: null, c: 3 }],
      },
      { a: 3, b: null, c: 3 },
    ],
  ],
});

test("$mergeObjects: More examples", (t) => {
  const orders = [
    { _id: 1, item: "abc", price: 12, ordered: 2 },
    { _id: 2, item: "jkl", price: 20, ordered: 1 },
  ];

  const items = [
    { _id: 1, item: "abc", description: "product 1", instock: 120 },
    { _id: 2, item: "def", description: "product 2", instock: 80 },
    { _id: 3, item: "jkl", description: "product 3", instock: 60 },
  ];

  let result = aggregate(orders, [
    {
      $lookup: {
        from: items,
        localField: "item", // field in the orders collection
        foreignField: "item", // field in the items collection
        as: "fromItems",
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ $arrayElemAt: ["$fromItems", 0] }, "$$ROOT"],
        },
      },
    },
    { $project: { fromItems: 0 } },
  ]);

  t.deepEqual(
    result,
    [
      {
        _id: 1,
        item: "abc",
        description: "product 1",
        instock: 120,
        price: 12,
        ordered: 2,
      },
      {
        _id: 2,
        item: "jkl",
        description: "product 3",
        instock: 60,
        price: 20,
        ordered: 1,
      },
    ],
    "can apply $mergeObjects"
  );

  const sales = [
    {
      _id: 1,
      year: 2017,
      item: "A",
      quantity: { "2017Q1": 500, "2017Q2": 500 },
    },
    {
      _id: 2,
      year: 2016,
      item: "A",
      quantity: { "2016Q1": 400, "2016Q2": 300, "2016Q3": 0, "2016Q4": 0 },
    },
    { _id: 3, year: 2017, item: "B", quantity: { "2017Q1": 300 } },
    {
      _id: 4,
      year: 2016,
      item: "B",
      quantity: { "2016Q3": 100, "2016Q4": 250 },
    },
  ];

  result = aggregate(sales, [
    { $group: { _id: "$item", mergedSales: { $mergeObjects: "$quantity" } } },
    { $sort: { _id: -1 } },
  ]);

  t.deepEqual(
    result,
    [
      {
        _id: "B",
        mergedSales: { "2017Q1": 300, "2016Q3": 100, "2016Q4": 250 },
      },
      {
        _id: "A",
        mergedSales: {
          "2017Q1": 500,
          "2017Q2": 500,
          "2016Q1": 400,
          "2016Q2": 300,
          "2016Q3": 0,
          "2016Q4": 0,
        },
      },
    ],
    "can apply $mergeObjects as accumulator"
  );

  t.end();
});
