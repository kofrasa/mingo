import test from "tape";

import { aggregate } from "../../src";
import { RawArray } from "../../src/types";

/**
 * Tests for $replaceRoot operator
 */
test("$replaceRoot pipeline operator", (t) => {
  const produce = [
    {
      _id: 1,
      fruit: ["apples", "oranges"],
      in_stock: { oranges: 20, apples: 60 },
      on_order: { oranges: 35, apples: 75 },
    },
    {
      _id: 2,
      vegetables: ["beets", "yams"],
      in_stock: { beets: 130, yams: 200 },
      on_order: { beets: 90, yams: 145 },
    },
  ];

  let result = aggregate(produce, [
    {
      $replaceRoot: { newRoot: "$in_stock" },
    },
  ]);

  t.deepEqual(
    result,
    [
      { oranges: 20, apples: 60 },
      { beets: 130, yams: 200 },
    ],
    "$replaceRoot with an embedded document"
  );

  const people = [
    { _id: 1, name: "Arlene", age: 34, pets: { dogs: 2, cats: 1 } },
    { _id: 2, name: "Sam", age: 41, pets: { cats: 1, hamsters: 3 } },
    { _id: 3, name: "Maria", age: 25 },
  ];

  result = aggregate(people, [
    {
      $match: { pets: { $exists: true } },
    },
    {
      $replaceRoot: { newRoot: "$pets" },
    },
  ]);

  t.deepEqual(
    result,
    [
      { dogs: 2, cats: 1 },
      { cats: 1, hamsters: 3 },
    ],
    "$replaceRoot with a $match stage"
  );

  let contacts: RawArray = [
    { _id: 1, first_name: "Gary", last_name: "Sheffield", city: "New York" },
    { _id: 2, first_name: "Nancy", last_name: "Walker", city: "Anaheim" },
    { _id: 3, first_name: "Peter", last_name: "Sumner", city: "Toledo" },
  ];

  result = aggregate(contacts, [
    {
      $replaceRoot: {
        newRoot: {
          full_name: {
            $concat: ["$first_name", " ", "$last_name"],
          },
        },
      },
    },
  ]);

  t.deepEqual(
    result,
    [
      { full_name: "Gary Sheffield" },
      { full_name: "Nancy Walker" },
      { full_name: "Peter Sumner" },
    ],
    "$replaceRoot with a newly created document"
  );

  contacts = [
    {
      _id: 1,
      name: "Susan",
      phones: [{ cell: "555-653-6527" }, { home: "555-965-2454" }],
    },
    {
      _id: 2,
      name: "Mark",
      phones: [{ cell: "555-445-8767" }, { home: "555-322-2774" }],
    },
  ];

  result = aggregate(contacts, [
    {
      $unwind: "$phones",
    },
    {
      $match: { "phones.cell": { $exists: true } },
    },
    {
      $replaceRoot: { newRoot: "$phones" },
    },
  ]);

  t.deepEqual(
    result,
    [{ cell: "555-653-6527" }, { cell: "555-445-8767" }],
    "$replaceRoot with an array element"
  );

  t.end();
});
