import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { studentsData, testPath } from "../../support";

describe(testPath(import.meta.url), () => {
  it("can apply $group operator with simple group key", () => {
    const res = aggregate(
      [
        { _id: 1, name: "dave123", quiz: 1, score: 85 },
        { _id: 2, name: "dave2", quiz: 1, score: 90 },
        { _id: 3, name: "ahn", quiz: 1, score: 71 },
        { _id: 4, name: "li", quiz: 2, score: 96 },
        { _id: 5, name: "annT", quiz: 2, score: 77 },
        { _id: 6, name: "ty", quiz: 2, score: 82 }
      ],
      [
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
      ]
    );

    expect(res).toEqual([
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
    ]);
  });

  it("can compute $max and $sum", () => {
    const res = aggregate(
      [
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
      [
        {
          $group: {
            _id: "$item",
            max: { $max: "$price" },
            sum: { $sum: "$price" }
          }
        },
        { $limit: 1 }
      ]
    );

    expect(res).toEqual([
      {
        _id: "abc",
        max: 10,
        sum: 20
      }
    ]);
  });

  it("can group with nested value", () => {
    const res = aggregate(aggregate(studentsData, [{ $unwind: "$scores" }]), [
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
    ]);

    expect(res).toEqual([
      {
        size: 3
      }
    ]);
  });

  const book = [
    { _id: 8751, title: "The Banquet", author: "Dante", copies: 2 },
    { _id: 8752, title: "Divine Comedy", author: "Dante", copies: 1 },
    { _id: 8645, title: "Eclogues", author: "Dante", copies: 2 },
    { _id: 7000, title: "The Odyssey", author: "Homer", copies: 10 },
    { _id: 7020, title: "Iliad", author: "Homer", copies: 10 }
  ];

  const booksByAuthor = [
    { _id: "Homer", books: ["The Odyssey", "Iliad"] },
    { _id: "Dante", books: ["The Banquet", "Divine Comedy", "Eclogues"] }
  ];

  it("group documents by author", () => {
    const res = aggregate(book, [
      { $group: { _id: "$author", books: { $push: "$$ROOT" } } },
      { $sort: { _id: -1 } }
    ]);

    expect(res).toEqual([
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
    ]);
  });

  it("group title by author", () => {
    const res = aggregate(book, [
      { $group: { _id: "$author", books: { $push: "$title" } } },
      { $sort: { _id: -1 } }
    ]);

    expect(res).toEqual(booksByAuthor);
  });

  it("group title by author using $$ROOT.title", () => {
    const res = aggregate(book, [
      { $group: { _id: "$author", books: { $push: "$$ROOT.title" } } },
      { $sort: { _id: -1 } }
    ]);

    expect(res).toEqual(booksByAuthor);
  });

  it("group title by author using $$CURRENT.title", () => {
    const res = aggregate(book, [
      { $group: { _id: "$author", books: { $push: "$$ROOT.title" } } },
      { $sort: { _id: -1 } }
    ]);

    expect(res).toEqual(booksByAuthor);
  });

  it("groups by object keys with multiple nested fields", () => {
    const res = aggregate(
      [
        {
          customer: {
            id: "C001",
            name: "Alice",
            order: "coke"
          }
        },
        {
          customer: {
            id: "C002",
            name: "Bob",
            order: "pepsi"
          }
        },
        {
          customer: {
            id: "C003",
            name: "Charlie",
            order: "cup"
          }
        },
        {
          customer: {
            id: "C001",
            name: "Alice",
            order: "biscuit"
          }
        },
        {
          customer: {
            id: "C002",
            name: "Bob",
            order: "cookie"
          }
        }
      ],
      [
        {
          $group: {
            _id: {
              customerId: "$customer.id",
              customerName: "$customer.name"
            },
            out: {
              $push: "$customer.order"
            }
          }
        }
      ]
    );

    expect(res).toEqual([
      {
        _id: {
          customerId: "C001",
          customerName: "Alice"
        },
        out: ["coke", "biscuit"]
      },
      {
        _id: {
          customerId: "C002",
          customerName: "Bob"
        },
        out: ["pepsi", "cookie"]
      },
      {
        _id: {
          customerId: "C003",
          customerName: "Charlie"
        },
        out: ["cup"]
      }
    ]);
  });
});
