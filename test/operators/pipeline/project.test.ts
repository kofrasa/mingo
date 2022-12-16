import { RawArray, RawObject } from "../../../src/types";
import * as samples from "../../support";

const productsData = [
  { _id: 1, item: "abc1", description: "product 1", qty: 300 },
  { _id: 2, item: "abc2", description: "product 2", qty: 200 },
  { _id: 3, item: "xyz1", description: "product 3", qty: 250 },
  { _id: 4, item: "VWZ1", description: "product 4", qty: 300 },
  { _id: 5, item: "VWZ2", description: "product 5", qty: 180 },
];

samples.runTestPipeline("operators/pipeline/project", [
  {
    message: "can project and rename fields with $project",
    pipeline: [
      { $unwind: "$scores" },
      {
        $project: {
          name: 1,
          type: "$scores.type",
          details: {
            plus10: { $add: ["$scores.score", 10] },
          },
        },
      },
      { $limit: 1 },
    ],
    input: samples.studentsData,
    expected: (result: Array<RawObject>) => {
      const fields = Object.keys(result[0]);
      expect(fields.length).toEqual(4);
      expect(fields).toContain("type");
      const temp = result[0]["details"] as RawObject;
      expect(Object.keys(temp).length).toEqual(1);
    },
  },

  {
    input: productsData,
    pipeline: [
      {
        $project: {
          item: 1,
          qty: 1,
          qtyEq250: { $eq: ["$qty", 250] },
          _id: 0,
        },
      },
    ],
    expected: [
      { item: "abc1", qty: 300, qtyEq250: false },
      { item: "abc2", qty: 200, qtyEq250: false },
      { item: "xyz1", qty: 250, qtyEq250: true },
      { item: "VWZ1", qty: 300, qtyEq250: false },
      { item: "VWZ2", qty: 180, qtyEq250: false },
    ],
    message: "can project with $eq operator",
  },

  {
    input: productsData,
    // $cmp
    pipeline: [
      {
        $project: {
          item: 1,
          qty: 1,
          cmpTo250: { $cmp: ["$qty", 250] },
          _id: 0,
        },
      },
    ],
    expected: [
      { item: "abc1", qty: 300, cmpTo250: 1 },
      { item: "abc2", qty: 200, cmpTo250: -1 },
      { item: "xyz1", qty: 250, cmpTo250: 0 },
      { item: "VWZ1", qty: 300, cmpTo250: 1 },
      { item: "VWZ2", qty: 180, cmpTo250: -1 },
    ],
    message: "can project with $cmp operator",
  },

  {
    message: "can exclude arbitrary field",
    input: samples.studentsData,
    pipeline: [
      {
        $project: {
          name: 0,
        },
      },
      { $limit: 1 },
    ],
    expected: (result: RawArray) => {
      expect(result[0]).toHaveProperty("_id");
      expect(result[0]).not.toHaveProperty("name");
      expect(result[0]).toHaveProperty("scores");
    },
  },

  {
    message: "can exclude '_id' field",
    input: samples.studentsData,
    pipeline: [
      {
        $project: {
          _id: 0,
        },
      },
      { $limit: 1 },
    ],
    expected: (result: RawArray) => {
      expect(result[0]).not.toHaveProperty("_id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("scores");
    },
  },

  {
    input: [
      { _id: 1, quizzes: [10, 6, 7], labs: [5, 8], final: 80, midterm: 75 },
      { _id: 2, quizzes: [9, 10], labs: [8, 8], final: 95, midterm: 80 },
      { _id: 3, quizzes: [4, 5, 5], labs: [6, 5], final: 78, midterm: 70 },
    ],
    pipeline: [
      {
        $project: {
          quizTotal: { $sum: "$quizzes" },
          labTotal: { $sum: "$labs" },
          examTotal: { $sum: ["$final", "$midterm"] },
        },
      },
    ],
    expected: [
      { _id: 1, quizTotal: 23, labTotal: 13, examTotal: 155 },
      { _id: 2, quizTotal: 19, labTotal: 16, examTotal: 175 },
      { _id: 3, quizTotal: 14, labTotal: 11, examTotal: 148 },
    ],
    message: "can $project new field with group operator",
  },

  {
    message: "exclude fields from embedded documents",
    input: [
      {
        _id: 1,
        title: "abc123",
        isbn: "0001122223334",
        author: { last: "zzz", first: "aaa" },
        copies: 5,
        lastModified: "2016-07-28",
      },
    ],
    pipeline: [{ $project: { "author.first": 0, lastModified: 0 } }],
    expected: [
      {
        _id: 1,
        title: "abc123",
        isbn: "0001122223334",
        author: {
          last: "zzz",
        },
        copies: 5,
      },
    ],
  },

  {
    message: "exclude fields from embedded documents using nested array syntax",
    input: [
      {
        _id: 1,
        title: "abc123",
        isbn: "0001122223334",
        author: { last: "zzz", first: "aaa" },
        copies: 5,
        lastModified: "2016-07-28",
      },
    ],
    pipeline: [{ $project: { author: { first: 0 }, lastModified: 0 } }],
    expected: [
      {
        _id: 1,
        title: "abc123",
        isbn: "0001122223334",
        author: {
          last: "zzz",
        },
        copies: 5,
      },
    ],
  },

  // Project with $$REMOVE
  // See: https://docs.mongodb.com/manual/reference/operator/aggregation/project/#remove-example
  {
    message: "$project conditionally exclude fields",
    input: [
      {
        _id: 1,
        title: "abc123",
        isbn: "0001122223334",
        author: { last: "zzz", first: "aaa" },
        copies: 5,
        lastModified: "2016-07-28",
      },
      {
        _id: 2,
        title: "Baked Goods",
        isbn: "9999999999999",
        author: { last: "xyz", first: "abc", middle: "" },
        copies: 2,
        lastModified: "2017-07-21",
      },
      {
        _id: 3,
        title: "Ice Cream Cakes",
        isbn: "8888888888888",
        author: { last: "xyz", first: "abc", middle: "mmm" },
        copies: 5,
        lastModified: "2017-07-22",
      },
    ],
    pipeline: [
      {
        $project: {
          title: 1,
          "author.first": 1,
          "author.last": 1,
          "author.middle": {
            $cond: {
              if: { $eq: ["", "$author.middle"] },
              then: "$$REMOVE",
              else: "$author.middle",
            },
          },
        },
      },
    ],
    expected: [
      { _id: 1, title: "abc123", author: { last: "zzz", first: "aaa" } },
      { _id: 2, title: "Baked Goods", author: { last: "xyz", first: "abc" } },
      {
        _id: 3,
        title: "Ice Cream Cakes",
        author: { last: "xyz", first: "abc", middle: "mmm" },
      },
    ],
  },
  {
    message: "project include specific fields from embedded documents",
    input: [
      {
        _id: 1,
        user: "1234",
        stop: { title: "book1", author: "xyz", page: 32 },
      },
      {
        _id: 2,
        user: "7890",
        stop: [
          { title: "book2", author: "abc", page: 5 },
          { title: "book3", author: "ijk", page: 100 },
        ],
      },
    ],
    pipeline: [{ $project: { "stop.title": 1 } }],
    expected: [
      { _id: 1, stop: { title: "book1" } },
      { _id: 2, stop: [{ title: "book2" }, { title: "book3" }] },
    ],
  },
  {
    message:
      "project include specific fields from embedded documents using nested array syntax",
    input: [
      {
        _id: 1,
        user: "1234",
        stop: { title: "book1", author: "xyz", page: 32 },
      },
      {
        _id: 2,
        user: "7890",
        stop: [
          { title: "book2", author: "abc", page: 5 },
          { title: "book3", author: "ijk", page: 100 },
        ],
      },
    ],
    pipeline: [{ $project: { stop: { title: 1 } } }],
    expected: [
      { _id: 1, stop: { title: "book1" } },
      { _id: 2, stop: [{ title: "book2" }, { title: "book3" }] },
    ],
  },
  {
    message: "project including computed fields",
    input: [
      {
        _id: 1,
        title: "abc123",
        isbn: "0001122223334",
        author: { last: "zzz", first: "aaa" },
        copies: 5,
      },
    ],
    pipeline: [
      {
        $project: {
          title: 1,
          isbn: {
            prefix: { $substr: ["$isbn", 0, 3] },
            group: { $substr: ["$isbn", 3, 2] },
            publisher: { $substr: ["$isbn", 5, 4] },
            title: { $substr: ["$isbn", 9, 3] },
            checkDigit: { $substr: ["$isbn", 12, 1] },
          },
          lastName: "$author.last",
          copiesSold: "$copies",
        },
      },
    ],
    expected: [
      {
        _id: 1,
        title: "abc123",
        isbn: {
          prefix: "000",
          group: "11",
          publisher: "2222",
          title: "333",
          checkDigit: "4",
        },
        lastName: "zzz",
        copiesSold: 5,
      },
    ],
  },
  {
    message: "project new array fields",
    input: [{ _id: 1, x: 1, y: 1 }],
    pipeline: [{ $project: { myArray: ["$x", "$y"] } }],
    expected: [{ _id: 1, myArray: [1, 1] }],
  },
  {
    message: "project new array fields with mssing fields",
    input: [{ _id: 1, x: 1, y: 1 }],
    pipeline: [{ $project: { myArray: ["$x", "$y", "$someField"] } }],
    expected: [{ _id: 1, myArray: [1, 1, null] }],
  },
  // test from https://github.com/kofrasa/mingo/issues/119
  {
    message: "should project new array fields (see #119)",
    input: [{ event: { x: "hi" } }],
    pipeline: [
      {
        $project: {
          myArray: ["$event.x"],
        },
      },
    ],
    expected: [{ myArray: ["hi"] }],
  },
  {
    message: "should project with $slice expression operator",
    input: [
      { _id: 1, fruits: ["apple", "banana"] },
      { _id: 2, fruits: ["orange", "kiwi"] },
      { _id: 3, fruits: ["blueberry"] },
    ],
    pipeline: [
      {
        $project: {
          bestFruit: { $slice: ["$fruits", 1, 1] },
        },
      },
    ],
    expected: [
      { _id: 1, bestFruit: ["banana"] },
      { _id: 2, bestFruit: ["kiwi"] },
      { _id: 3, bestFruit: [] },
    ],
  },

  // Bug fix: https://github.com/kofrasa/mingo/issues/284
  {
    message: "should resolve with root object when available.",
    pipeline: [
      {
        $project: {
          foo: {
            bar: {
              baz: { $abs: "$foo.bar.baz" },
            },
          },
        },
      },
    ],
    input: [{ foo: { bar: { baz: -1 }, baz: -10 }, baz: -100 }],
    expected: [{ foo: { bar: { baz: 1 } } }],
  },

  {
    message: "should exclude deep nested objects with dot syntax",
    pipeline: [
      {
        $project: {
          "comments.title": 0,
          "comments.comments.comments": 0,
          numbers: 0,
        },
      },
    ],
    input: [
      {
        _id: "639b4a1dc9414e958b1484ba",
        title: "mingo is cool",
        numbers: [],
        owners: [],
        comments: [
          {
            title: "a",
            body: "body",
            comments: [],
          },
          {
            title: "b",
            body: "body",
            comments: [
              {
                title: "c",
                comments: [],
              },
            ],
          },
        ],
        text: "kandinsky",
      },
    ],
    expected: [
      {
        _id: "639b4a1dc9414e958b1484ba",
        comments: [
          {
            body: "body",
            comments: [],
          },
          {
            body: "body",
            comments: [
              {
                title: "c",
              },
            ],
          },
        ],
        owners: [],
        text: "kandinsky",
        title: "mingo is cool",
      },
    ],
  },
]);
