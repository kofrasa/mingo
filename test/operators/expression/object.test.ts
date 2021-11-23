import { aggregate } from "../../../src";
import { ProcessingMode } from "../../../src/core";
import * as support from "../../support";

describe("operators/expression/object", () => {
  support.runTest("$mergeObjects", {
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

  describe("$mergeObjects: More examples", () => {
    const orders = [
      { _id: 1, item: "abc", price: 12, ordered: 2 },
      { _id: 2, item: "jkl", price: 20, ordered: 1 },
    ];

    const items = [
      { _id: 1, item: "abc", description: "product 1", instock: 120 },
      { _id: 2, item: "def", description: "product 2", instock: 80 },
      { _id: 3, item: "jkl", description: "product 3", instock: 60 },
    ];

    it("can apply $mergeObjects", () => {
      const result = aggregate(orders, [
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

      expect(result).toStrictEqual([
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
      ]);
    });

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

    it("can apply $mergeObjects as accumulator", () => {
      const result = aggregate(sales, [
        {
          $group: { _id: "$item", mergedSales: { $mergeObjects: "$quantity" } },
        },
        { $sort: { _id: -1 } },
      ]);

      expect(result).toStrictEqual([
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
      ]);
    });
  });

  describe("$setFields", () => {
    const data = [
      { _id: 1, item: "sweatshirt", price: 45.99, qty: 300 },
      { _id: 2, item: "winter coat", price: 499.99, qty: 200 },
      { _id: 3, item: "sun dress", price: 199.99, qty: 250 },
      { _id: 4, item: "leather boots", price: 249.99, qty: 300 },
      { _id: 5, item: "bow tie", price: 9.99, qty: 180 },
    ];

    const options = { processingMode: ProcessingMode.CLONE_INPUT };

    it("Add Fields that Contain Periods ", () => {
      const result = aggregate(
        data,
        [
          {
            $replaceWith: {
              newRoot: {
                $setField: {
                  field: "price.usd",
                  input: "$$ROOT",
                  value: "$price",
                },
              },
            },
          },
          { $unset: "price" },
        ],
        options
      );

      expect(result).toStrictEqual([
        { _id: 1, item: "sweatshirt", qty: 300, "price.usd": 45.99 },
        { _id: 2, item: "winter coat", qty: 200, "price.usd": 499.99 },
        { _id: 3, item: "sun dress", qty: 250, "price.usd": 199.99 },
        { _id: 4, item: "leather boots", qty: 300, "price.usd": 249.99 },
        { _id: 5, item: "bow tie", qty: 180, "price.usd": 9.99 },
      ]);
    });

    it("Add Fields that Start with a Dollar Sign", () => {
      const result = aggregate(
        data,
        [
          {
            $replaceWith: {
              newRoot: {
                $setField: {
                  field: { $literal: "$price" },
                  input: "$$ROOT",
                  value: "$price",
                },
              },
            },
          },
          { $unset: "price" },
        ],
        options
      );

      expect(result).toStrictEqual([
        { _id: 1, item: "sweatshirt", qty: 300, $price: 45.99 },
        { _id: 2, item: "winter coat", qty: 200, $price: 499.99 },
        { _id: 3, item: "sun dress", qty: 250, $price: 199.99 },
        { _id: 4, item: "leather boots", qty: 300, $price: 249.99 },
        { _id: 5, item: "bow tie", qty: 180, $price: 9.99 },
      ]);
    });

    it("Update Fields that Contain Periods", () => {
      const result = aggregate(
        data,
        [
          { $match: { _id: 1 } },
          {
            $replaceWith: {
              newRoot: {
                $setField: {
                  field: "price.usd",
                  input: "$$ROOT",
                  value: 49.99,
                },
              },
            },
          },
          { $unset: "price" },
        ],
        options
      );

      expect(result).toStrictEqual([
        { _id: 1, item: "sweatshirt", qty: 300, "price.usd": 49.99 },
      ]);
    });

    it("Update Fields that Start with a Dollar Sign", () => {
      const result = aggregate(
        [
          { _id: 1, item: "sweatshirt", qty: 300, $price: 45.99 },
          { _id: 2, item: "winter coat", qty: 200, $price: 499.99 },
          { _id: 3, item: "sun dress", qty: 250, $price: 199.99 },
          { _id: 4, item: "leather boots", qty: 300, $price: 249.99 },
          { _id: 5, item: "bow tie", qty: 180, $price: 9.99 },
        ],
        [
          { $match: { _id: 1 } },
          {
            $replaceWith: {
              newRoot: {
                $setField: {
                  field: { $literal: "$price" },
                  input: "$$ROOT",
                  value: 49.99,
                },
              },
            },
          },
        ],
        options
      );

      expect(result).toStrictEqual([
        { _id: 1, item: "sweatshirt", qty: 300, $price: 49.99 },
      ]);
    });

    it("Remove Fields that Contain Periods", () => {
      const result = aggregate(
        [
          { _id: 1, item: "sweatshirt", qty: 300, "price.usd": 45.99 },
          { _id: 2, item: "winter coat", qty: 200, "price.usd": 499.99 },
          { _id: 3, item: "sun dress", qty: 250, "price.usd": 199.99 },
          { _id: 4, item: "leather boots", qty: 300, "price.usd": 249.99 },
          { _id: 5, item: "bow tie", qty: 180, "price.usd": 9.99 },
        ],
        [
          {
            $replaceWith: {
              newRoot: {
                $setField: {
                  field: "price.usd",
                  input: "$$ROOT",
                  value: "$$REMOVE",
                },
              },
            },
          },
        ],
        options
      );

      expect(result).toStrictEqual([
        { _id: 1, item: "sweatshirt", qty: 300 },
        { _id: 2, item: "winter coat", qty: 200 },
        { _id: 3, item: "sun dress", qty: 250 },
        { _id: 4, item: "leather boots", qty: 300 },
        { _id: 5, item: "bow tie", qty: 180 },
      ]);
    });

    it("Remove Fields that Start with a Dollar Sign", () => {
      const result = aggregate(
        [
          { _id: 1, item: "sweatshirt", qty: 300, $price: 45.99 },
          { _id: 2, item: "winter coat", qty: 200, $price: 499.99 },
          { _id: 3, item: "sun dress", qty: 250, $price: 199.99 },
          { _id: 4, item: "leather boots", qty: 300, $price: 249.99 },
          { _id: 5, item: "bow tie", qty: 180, $price: 9.99 },
        ],
        [
          {
            $replaceWith: {
              newRoot: {
                $unsetField: {
                  field: { $literal: "$price" },
                  input: "$$ROOT",
                },
              },
            },
          },
        ],
        options
      );

      expect(result).toStrictEqual([
        { _id: 1, item: "sweatshirt", qty: 300 },
        { _id: 2, item: "winter coat", qty: 200 },
        { _id: 3, item: "sun dress", qty: 250 },
        { _id: 4, item: "leather boots", qty: 300 },
        { _id: 5, item: "bow tie", qty: 180 },
      ]);
    });
  });
});
