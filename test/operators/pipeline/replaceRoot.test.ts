import * as samples from "../../support";

samples.runTestPipeline("operators/pipeline/replaceRoot", [
  {
    message: "$replaceRoot with an embedded document",
    input: [
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
    ],
    pipeline: [
      {
        $replaceRoot: { newRoot: "$in_stock" },
      },
    ],
    expected: [
      { oranges: 20, apples: 60 },
      { beets: 130, yams: 200 },
    ],
  },

  {
    message: "$replaceRoot with a $match stage",
    input: [
      { _id: 1, name: "Arlene", age: 34, pets: { dogs: 2, cats: 1 } },
      { _id: 2, name: "Sam", age: 41, pets: { cats: 1, hamsters: 3 } },
      { _id: 3, name: "Maria", age: 25 },
    ],

    pipeline: [
      {
        $match: { pets: { $exists: true } },
      },
      {
        $replaceRoot: { newRoot: "$pets" },
      },
    ],

    expected: [
      { dogs: 2, cats: 1 },
      { cats: 1, hamsters: 3 },
    ],
  },

  {
    message: "$replaceRoot with a newly created document",
    input: [
      { _id: 1, first_name: "Gary", last_name: "Sheffield", city: "New York" },
      { _id: 2, first_name: "Nancy", last_name: "Walker", city: "Anaheim" },
      { _id: 3, first_name: "Peter", last_name: "Sumner", city: "Toledo" },
    ],
    pipeline: [
      {
        $replaceRoot: {
          newRoot: {
            full_name: {
              $concat: ["$first_name", " ", "$last_name"],
            },
          },
        },
      },
    ],
    expected: [
      { full_name: "Gary Sheffield" },
      { full_name: "Nancy Walker" },
      { full_name: "Peter Sumner" },
    ],
  },

  {
    message: "$replaceRoot with an array element",
    input: [
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
    ],
    pipeline: [
      {
        $unwind: "$phones",
      },
      {
        $match: { "phones.cell": { $exists: true } },
      },
      {
        $replaceRoot: { newRoot: "$phones" },
      },
    ],
    expected: [{ cell: "555-653-6527" }, { cell: "555-445-8767" }],
  },
]);
