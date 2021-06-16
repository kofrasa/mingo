import test from "tape";

import { aggregate } from "../../src";

/**
 * Tests for $lookup operator
 */
test("$lookup pipeline operator", (t) => {
  const orders = [
    { _id: 1, item: { name: "abc" }, price: 12, quantity: 2 },
    { _id: 2, item: { name: "jkl" }, price: 20, quantity: 1 },
    { _id: 3 },
  ];

  const inventory = [
    { _id: 1, sku: "abc", description: "product 1", instock: 120 },
    { _id: 2, sku: "def", description: "product 2", instock: 80 },
    { _id: 3, sku: "ijk", description: "product 3", instock: 60 },
    { _id: 4, sku: "jkl", description: "product 4", instock: 70 },
    { _id: 5, sku: null, description: "Incomplete" },
    { _id: 6 },
  ];

  const result = aggregate(orders, [
    {
      $lookup: {
        from: inventory,
        localField: "item.name",
        foreignField: "sku",
        as: "inventory_docs",
      },
    },
  ]);

  t.deepEqual(
    result,
    [
      {
        _id: 1,
        item: { name: "abc" },
        price: 12,
        quantity: 2,
        inventory_docs: [
          { _id: 1, sku: "abc", description: "product 1", instock: 120 },
        ],
      },
      {
        _id: 2,
        item: { name: "jkl" },
        price: 20,
        quantity: 1,
        inventory_docs: [
          { _id: 4, sku: "jkl", description: "product 4", instock: 70 },
        ],
      },
      {
        _id: 3,
        inventory_docs: [
          { _id: 5, sku: null, description: "Incomplete" },
          { _id: 6 },
        ],
      },
    ],
    "can apply $lookup operator"
  );

  t.end();
});
