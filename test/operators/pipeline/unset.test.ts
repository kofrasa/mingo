import * as samples from "../../support";

const books = [
  {
    _id: 1,
    title: "Antelope Antics",
    isbn: "0001122223334",
    author: { last: "An", first: "Auntie" },
    copies: [
      { warehouse: "A", qty: 5 },
      { warehouse: "B", qty: 15 },
    ],
  },
  {
    _id: 2,
    title: "Bees Babble",
    isbn: "999999999333",
    author: { last: "Bumble", first: "Bee" },
    copies: [
      { warehouse: "A", qty: 2 },
      { warehouse: "B", qty: 5 },
    ],
  },
];

samples.runTestPipeline("operators/pipeline/unset", [
  {
    message: "Remove a Single Field",
    pipeline: [{ $unset: "copies" }],
    input: books,
    expected: [
      {
        _id: 1,
        title: "Antelope Antics",
        isbn: "0001122223334",
        author: { last: "An", first: "Auntie" },
      },
      {
        _id: 2,
        title: "Bees Babble",
        isbn: "999999999333",
        author: { last: "Bumble", first: "Bee" },
      },
    ],
  },
  {
    message: "Remove Top-Level Fields",
    pipeline: [{ $unset: ["isbn", "copies"] }],
    input: books,
    expected: [
      {
        _id: 1,
        title: "Antelope Antics",
        author: { last: "An", first: "Auntie" },
      },
      {
        _id: 2,
        title: "Bees Babble",
        author: { last: "Bumble", first: "Bee" },
      },
    ],
  },
  {
    message: "Remove Embedded Fields",
    pipeline: [{ $unset: ["isbn", "author.first", "copies.warehouse"] }],
    input: books,
    expected: [
      {
        _id: 1,
        title: "Antelope Antics",
        author: { last: "An" },
        copies: [{ qty: 5 }, { qty: 15 }],
      },
      {
        _id: 2,
        title: "Bees Babble",
        author: { last: "Bumble" },
        copies: [{ qty: 2 }, { qty: 5 }],
      },
    ],
  },
]);
