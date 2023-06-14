import { aggregate } from "../../../src";
import * as samples from "../../support";

const book = [
  { _id: 8751, title: "The Banquet", author: "Dante", copies: 2 },
  { _id: 8752, title: "Divine Comedy", author: "Dante", copies: 1 },
  { _id: 8645, title: "Eclogues", author: "Dante", copies: 2 },
  { _id: 7000, title: "The Odyssey", author: "Homer", copies: 10 },
  { _id: 7020, title: "Iliad", author: "Homer", copies: 10 }
];

samples.runTestPipeline("operators/pipeline/group", [
  {
    message: "can apply $group operators",
    input: [
      { _id: 1, name: "dave123", quiz: 1, score: 85 },
      { _id: 2, name: "dave2", quiz: 1, score: 90 },
      { _id: 3, name: "ahn", quiz: 1, score: 71 },
      { _id: 4, name: "li", quiz: 2, score: 96 },
      { _id: 5, name: "annT", quiz: 2, score: 77 },
      { _id: 6, name: "ty", quiz: 2, score: 82 }
    ],
    pipeline: [
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
          people: { $push: "$name" }
        }
      },
      { $limit: 1 }
    ],
    expected: [
      {
        _id: 1,
        people: ["ahn", "dave123", "dave2"],
        quiz: [1],
        avg: 82,
        first: "ahn",
        last: "dave2",
        max: 90,
        min: 71,
        stdDevPop: 8.04155872120988,
        stdDevSamp: 9.848857801796104,
        sum: 246
      }
    ]
  },
  {
    message: "can compute $max and $sum",
    input: [
      {
        _id: 1,
        item: "abc",
        price: 10,
        quantity: 2,
        date: new Date("2014-01-01T08:00:00Z")
      },
      {
        _id: 2,
        item: "jkl",
        price: 20,
        quantity: 1,
        date: new Date("2014-02-03T09:00:00Z")
      },
      {
        _id: 3,
        item: "xyz",
        price: 5,
        quantity: 5,
        date: new Date("2014-02-03T09:05:00Z")
      },
      {
        _id: 10,
        item: "xyz",
        quantity: 5,
        date: new Date("2014-02-03T09:05:00Z")
      },
      {
        _id: 4,
        item: "abc",
        price: 10,
        quantity: 10,
        date: new Date("2014-02-15T08:00:00Z")
      },
      {
        _id: 5,
        item: "xyz",
        price: 5,
        quantity: 10,
        date: new Date("2014-02-15T09:05:00Z")
      }
    ],

    pipeline: [
      {
        $group: {
          _id: "$item",
          max: { $max: "$price" },
          sum: { $sum: "$price" }
        }
      },
      { $limit: 1 }
    ],
    expected: [
      {
        _id: "abc",
        max: 10,
        sum: 20
      }
    ]
  },
  {
    message: "can group collection with $group",
    input: aggregate(
      samples.studentsData,
      [{ $unwind: "$scores" }],
      samples.DEFAULT_OPTS
    ),
    pipeline: [
      {
        $group: {
          _id: "$scores.type",
          highest: { $max: "$scores.score" },
          lowest: { $min: "$scores.score" },
          average: { $avg: "$scores.score" },
          count: { $sum: 1 }
        }
      },
      { $count: "size" }
    ],
    expected: [
      {
        size: 3
      }
    ]
  },

  {
    message: "can group by object key",
    input: samples.groupByObjectsData,
    pipeline: [
      { $match: {} },
      {
        $group: {
          _id: {
            hour: "$date_buckets.hour",
            keyword: "$Keyword"
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          //"hour": "$_id.hour",
          keyword: "$_id.keyword",
          total: 1
        }
      }
    ],
    expected: [
      { total: 2, keyword: "Bathroom Cleaning Tips" },
      { total: 1, keyword: "Cleaning Bathroom Tips" },
      { total: 1, keyword: "best way to clean a bathroom" },
      { total: 1, keyword: "Drain Clogs" },
      { total: 1, keyword: "unclog bathtub drain" }
    ]
  },

  {
    message: "Group title by author",
    input: book,
    pipeline: [
      { $group: { _id: "$author", books: { $push: "$title" } } },
      { $sort: { _id: -1 } }
    ],
    expected: [
      { _id: "Homer", books: ["The Odyssey", "Iliad"] },
      { _id: "Dante", books: ["The Banquet", "Divine Comedy", "Eclogues"] }
    ]
  },
  {
    message: "Group Documents by author",
    input: book,
    pipeline: [
      { $group: { _id: "$author", books: { $push: "$$ROOT" } } },
      { $sort: { _id: -1 } }
    ],
    expected: [
      {
        _id: "Homer",
        books: [
          { _id: 7000, title: "The Odyssey", author: "Homer", copies: 10 },
          { _id: 7020, title: "Iliad", author: "Homer", copies: 10 }
        ]
      },
      {
        _id: "Dante",
        books: [
          { _id: 8751, title: "The Banquet", author: "Dante", copies: 2 },
          { _id: 8752, title: "Divine Comedy", author: "Dante", copies: 1 },
          { _id: 8645, title: "Eclogues", author: "Dante", copies: 2 }
        ]
      }
    ]
  },

  {
    message: "Group title by author - $$ROOT.title",
    input: book,
    pipeline: [
      { $group: { _id: "$author", books: { $push: "$$ROOT.title" } } },
      { $sort: { _id: -1 } }
    ],
    expected: [
      { _id: "Homer", books: ["The Odyssey", "Iliad"] },
      { _id: "Dante", books: ["The Banquet", "Divine Comedy", "Eclogues"] }
    ]
  },
  {
    message: "Group title by author - $$CURRENT.title",

    input: book,
    pipeline: [
      { $group: { _id: "$author", books: { $push: "$$CURRENT.title" } } },
      { $sort: { _id: -1 } }
    ],
    expected: [
      { _id: "Homer", books: ["The Odyssey", "Iliad"] },
      { _id: "Dante", books: ["The Banquet", "Divine Comedy", "Eclogues"] }
    ]
  }
]);
