import test from "tape";

import { aggregate } from "../../src";
import { RawObject } from "../../src/types";
import * as samples from "../support";

test("$group pipeline operator", (t) => {
  const data = [
    { _id: 1, name: "dave123", quiz: 1, score: 85 },
    { _id: 2, name: "dave2", quiz: 1, score: 90 },
    { _id: 3, name: "ahn", quiz: 1, score: 71 },
    { _id: 4, name: "li", quiz: 2, score: 96 },
    { _id: 5, name: "annT", quiz: 2, score: 77 },
    { _id: 6, name: "ty", quiz: 2, score: 82 },
  ];

  const result = aggregate(data, [
    { $sort: { name: 1 } },
    {
      $group: {
        _id: "$quiz",
        quiz: { $addToSet: "$quiz" },
        avg: { $avg: "$score" },
        first: { $first: "$name" },
        last: { $last: "$name" },
        max: { $max: "$score" },
        min: { $min: "$score" },
        stdDevPop: { $stdDevPop: "$score" },
        stdDevSamp: { $stdDevSamp: "$score" },
        sum: { $sum: "$score" },
        people: { $push: "$name" },
      },
    },
  ]) as Array<RawObject>;

  t.deepEqual(result.length, 2, "can apply group operator stage");
  t.deepEqual(result[0].people, ["ahn", "dave123", "dave2"], "can apply $push");
  t.deepEqual(result[0].quiz, [1], "can apply $addToSet");
  t.deepEqual(result[0].avg, 82, "can apply $avg");
  t.deepEqual(result[0].first, "ahn", "can apply $first");
  t.deepEqual(result[0].last, "dave2", "can apply $last");
  t.deepEqual(result[0].max, 90, "can apply $max");
  t.deepEqual(result[0].min, 71, "can apply $min");
  t.deepEqual(result[0].stdDevPop, 8.04155872120988, "can apply $stdDevPop");
  t.deepEqual(result[0].stdDevSamp, 9.848857801796104, "can apply $stdDevSamp");
  t.deepEqual(result[0].sum, 246, "can apply $sum");

  t.end();
});

test("$group pipeline operator: more examples", (t) => {
  const sales = [
    {
      _id: 1,
      item: "abc",
      price: 10,
      quantity: 2,
      date: new Date("2014-01-01T08:00:00Z"),
    },
    {
      _id: 2,
      item: "jkl",
      price: 20,
      quantity: 1,
      date: new Date("2014-02-03T09:00:00Z"),
    },
    {
      _id: 3,
      item: "xyz",
      price: "5",
      quantity: 5,
      date: new Date("2014-02-03T09:05:00Z"),
    },
    {
      _id: 10,
      item: "xyz",
      quantity: 5,
      date: new Date("2014-02-03T09:05:00Z"),
    },
    {
      _id: 4,
      item: "abc",
      price: 10,
      quantity: 10,
      date: new Date("2014-02-15T08:00:00Z"),
    },
    {
      _id: 5,
      item: "xyz",
      price: 5,
      quantity: 10,
      date: new Date("2014-02-15T09:05:00Z"),
    },
  ];

  const flattened = aggregate(samples.studentsData, [{ $unwind: "$scores" }]);
  let grouped = aggregate(flattened, [
    {
      $group: {
        _id: "$scores.type",
        highest: { $max: "$scores.score" },
        lowest: { $min: "$scores.score" },
        average: { $avg: "$scores.score" },
        count: { $sum: 1 },
      },
    },
  ]);
  t.ok(grouped.length === 3, "can group collection with $group");
  grouped = aggregate(sales, [
    { $group: { max: { $max: "$price" }, sum: { $sum: "$price" } } },
  ]);

  t.ok(grouped.length === 1 && grouped[0]["max"] === 20, "can compute $max");
  t.ok(grouped.length === 1 && grouped[0]["sum"] === 45, "can compute $sum");

  grouped = aggregate(samples.groupByObjectsData, [
    { $match: {} },
    {
      $group: {
        _id: {
          hour: "$date_buckets.hour",
          keyword: "$Keyword",
        },
        total: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 0,
        //"hour": "$_id.hour",
        keyword: "$_id.keyword",
        total: 1,
      },
    },
  ]);

  t.deepEqual(
    grouped,
    [
      { total: 2, keyword: "Bathroom Cleaning Tips" },
      { total: 1, keyword: "Cleaning Bathroom Tips" },
      { total: 1, keyword: "best way to clean a bathroom" },
      { total: 1, keyword: "Drain Clogs" },
      { total: 1, keyword: "unclog bathtub drain" },
    ],
    "can group by object key"
  );

  const books = [
    { _id: 8751, title: "The Banquet", author: "Dante", copies: 2 },
    { _id: 8752, title: "Divine Comedy", author: "Dante", copies: 1 },
    { _id: 8645, title: "Eclogues", author: "Dante", copies: 2 },
    { _id: 7000, title: "The Odyssey", author: "Homer", copies: 10 },
    { _id: 7020, title: "Iliad", author: "Homer", copies: 10 },
  ];

  let result = aggregate(books, [
    { $group: { _id: "$author", books: { $push: "$title" } } },
    { $sort: { _id: -1 } },
  ]);

  t.deepEqual(
    result,
    [
      { _id: "Homer", books: ["The Odyssey", "Iliad"] },
      { _id: "Dante", books: ["The Banquet", "Divine Comedy", "Eclogues"] },
    ],
    "Group title by author"
  );

  result = aggregate(books, [
    { $group: { _id: "$author", books: { $push: "$$ROOT" } } },
    { $sort: { _id: -1 } },
  ]);

  t.deepEqual(
    result,
    [
      {
        _id: "Homer",
        books: [
          { _id: 7000, title: "The Odyssey", author: "Homer", copies: 10 },
          { _id: 7020, title: "Iliad", author: "Homer", copies: 10 },
        ],
      },
      {
        _id: "Dante",
        books: [
          { _id: 8751, title: "The Banquet", author: "Dante", copies: 2 },
          { _id: 8752, title: "Divine Comedy", author: "Dante", copies: 1 },
          { _id: 8645, title: "Eclogues", author: "Dante", copies: 2 },
        ],
      },
    ],
    "Group Documents by author"
  );

  const expected = [
    { _id: "Homer", books: ["The Odyssey", "Iliad"] },
    { _id: "Dante", books: ["The Banquet", "Divine Comedy", "Eclogues"] },
  ];

  result = aggregate(books, [
    { $group: { _id: "$author", books: { $push: "$$ROOT.title" } } },
    { $sort: { _id: -1 } },
  ]);

  t.deepEqual(result, expected, "Group title by author - $$ROOT.title");

  result = aggregate(books, [
    { $group: { _id: "$author", books: { $push: "$$CURRENT.title" } } },
    { $sort: { _id: -1 } },
  ]);

  t.deepEqual(result, expected, "Group title by author - $$CURRENT.title");

  t.end();
});

test("$group pipeline operator is idempotent", (t) => {
  const aggregator = [
    {
      $group: {
        _id: "$student_id",
        score: { $min: "$score" },
      },
    },
  ];

  const input = [
    { type: "exam", student_id: 2, score: 5 },
    { type: "exam", student_id: 1, score: 5 },
    { type: "homework", student_id: 1, score: 7 },
    { type: "homework", student_id: 2, score: 10 },
  ];

  const passOne = aggregate(input, aggregator);

  const passTwo = aggregate(input, aggregator);

  t.deepEqual(
    passTwo,
    passOne,
    "2nd-pass $group result is identical to the 1st-pass results."
  );

  t.end();
});
