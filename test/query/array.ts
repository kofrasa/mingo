import "../../src/init/system";

import test from "tape";

import { find, Query } from "../../src";
import { RawArray, RawObject } from "../../src/types";

interface UserResult {
  user: { username: string };
}

test("Query Array Operators", (t) => {
  let data: Array<RawObject> = [
    {
      _id: "5234ccb7687ea597eabee677",
      code: "efg",
      tags: ["school", "book"],
      qty: [
        { size: "S", num: 10, color: "blue" },
        { size: "M", num: 100, color: "blue" },
        { size: "L", num: 100, color: "green" },
      ],
    },
    {
      _id: "52350353b2eff1353b349de9",
      code: "ijk",
      tags: ["electronics", "school"],
      qty: [{ size: "M", num: 100, color: "green" }],
    },
  ];
  const q = new Query({
    qty: {
      $all: [
        { $elemMatch: { size: "M", num: { $gt: 50 } } },
        { $elemMatch: { num: 100, color: "green" } },
      ],
    },
  });

  let booleanResult = true;
  data.forEach(function (obj) {
    booleanResult = booleanResult && q.test(obj);
  });

  t.ok(booleanResult, "can match object using $all with $elemMatch");

  data = [
    {
      key0: [
        {
          key1: [
            [[{ key2: [{ a: "value2" }, { a: "dummy" }, { b: 20 }] }]],
            { key2: "value" },
          ],
          key1a: { key2a: "value2a" },
        },
      ],
    },
  ];

  let fixtures: Array<RawArray> = [
    [
      { "key0.key1.key2.a": "value2" },
      [],
      "should not match without array index selector to nested value ",
    ],
    [
      { "key0.key1.0.key2.a": "value2" },
      [],
      "should not match without enough depth for array index selector to nested value",
    ],
    [
      { "key0.key1.0.0.key2.a": "value2" },
      data,
      "should match with full array index selector to deeply nested value",
    ],
    [
      { "key0.key1.0.0.key2": { b: 20 } },
      data,
      "should match with array index selector to nested value at depth 1",
    ],
    [
      { "key0.key1.1.key2": "value" },
      data,
      "should match with full array index selector to nested value",
    ],
    [
      { "key0.key1.key2": "value" },
      data,
      "should match without array index selector to nested value at depth 1",
    ],
    [
      { "key0.key1.1.key2": "value" },
      data,
      "should match shallow nested value with array index selector",
    ],
  ];

  fixtures.forEach((row: RawArray) => {
    const query = row[0] as RawObject;
    const expected = row[1];
    const message = row[2] as string;

    const result = find(data, query).all();
    t.deepEqual(result, expected, message);
  });

  fixtures = [
    [
      {
        "key0.key1": [[{ key2: [{ a: "value2" }, { a: "dummy" }, { b: 20 }] }]],
      },
      "should match full key selector",
    ],
    [
      {
        "key0.key1.0": [
          [{ key2: [{ a: "value2" }, { a: "dummy" }, { b: 20 }] }],
        ],
      },
      "should match with key<-->index selector",
    ],
    [
      {
        "key0.key1.0.0": [
          { key2: [{ a: "value2" }, { a: "dummy" }, { b: 20 }] },
        ],
      },
      "should match with key<-->multi-index selector",
    ],
    [
      { "key0.key1.0.0.key2": [{ a: "value2" }, { a: "dummy" }, { b: 20 }] },
      "should match with key<-->multi-index<-->key selector",
    ],
  ];

  // should match whole objects
  fixtures.forEach(function (row) {
    const query = row[0] as RawObject;
    const message = row[1] as string;
    const result = find(data, query) as Iterable<RawObject>;

    // using iterator
    t.deepEqual(Array.from(result), data, message);
    t.ok(Array.from(result).length === 0, "iterator should be empty");
  });

  // https://github.com/kofrasa/mingo/issues/51
  data = [{ key0: [{ key1: ["value"] }, { key1: ["value1"] }] }];
  const singleResult = find(data, { "key0.key1": { $eq: "value" } }).next();
  t.deepEqual(
    singleResult,
    data[0],
    "should match nested array of objects without indices"
  );

  // https://github.com/kofrasa/mingo/issues/93
  data = [
    {
      id: 1,
      sub: [
        { id: 11, name: "OneOne", test: true },
        { id: 22, name: "TwoTwo", test: false },
      ],
    },
  ];

  let arrayResult = find(data, {}, { "sub.id": 1, "sub.name": 1 }).all();
  t.deepEqual(
    arrayResult,
    [
      {
        sub: [
          { id: 11, name: "OneOne" },
          { id: 22, name: "TwoTwo" },
        ],
      },
    ],
    "should project all matched elements of nested array"
  );

  // https://github.com/kofrasa/mingo/issues/105 - fix merging distinct objects during projection
  arrayResult = find(
    [{ items: [{ from: 1 }, { to: 2 }] }],
    {},
    { "items.from": 1, "items.to": 1 }
  ).all();
  t.deepEqual(
    arrayResult,
    [{ items: [{ from: 1 }, { to: 2 }] }],
    "should project multiple nested elements"
  );

  // extended test for missing keys of nested values
  arrayResult = find(
    [{ items: [{ from: 1, to: null }, { to: 2 }] }],
    {},
    { "items.from": 1, "items.to": 1 }
  ).all();
  t.deepEqual(
    arrayResult,
    [{ items: [{ from: 1, to: null }, { to: 2 }] }],
    "project multiple nested elements with missing keys"
  );

  // https://github.com/kofrasa/mingo/issues/106 - fix nested elements splitting after projection due to out of order matching
  arrayResult = find(
    [{ history: [{ user: "Jeff", notes: "asdf" }, { user: "Gary" }] }],
    {},
    {
      "history.user": 1,
      "history.notes": 1,
    }
  ).all();

  t.deepEqual(
    arrayResult,
    [
      {
        history: [
          {
            user: "Jeff",
            notes: "asdf",
          },
          {
            user: "Gary",
          },
        ],
      },
    ],
    "project multiple nested objects with missing keys and matched out of order"
  );

  t.end();
});

test("Match $all with $elemMatch on nested elements", (t) => {
  t.plan(1);

  const data = [
    {
      user: {
        username: "User1",
        projects: [
          { name: "Project 1", rating: { complexity: 6 } },
          { name: "Project 2", rating: { complexity: 2 } },
        ],
      },
    },
    {
      user: {
        username: "User2",
        projects: [
          { name: "Project 1", rating: { complexity: 6 } },
          { name: "Project 2", rating: { complexity: 8 } },
        ],
      },
    },
  ];
  const criteria = {
    "user.projects": {
      $all: [{ $elemMatch: { "rating.complexity": { $gt: 6 } } }],
    },
  };
  // It should return one user object
  const result = find(data, criteria).count();
  t.ok(result === 1, "can match using $all with $elemMatch on nested elements");
});

test("Match $all with regex", (t) => {
  t.plan(3);

  const data = [
    {
      user: {
        username: "User1",
        projects: ["foo", "bar"],
      },
    },
    {
      user: {
        username: "User2",
        projects: ["foo", "baz"],
      },
    },
    {
      user: {
        username: "User3",
        projects: ["fizz", "buzz"],
      },
    },
    {
      user: {
        username: "User4",
        projects: [],
      },
    },
  ];
  const criteria = {
    "user.projects": {
      $all: ["foo", /^ba/],
    },
  };
  // It should return two user objects
  const results = find(data, criteria).all();

  t.equal(
    results.length,
    2,
    "can match using $all with regex mixed with strings"
  );
  t.equal(
    (results[0] as UserResult).user.username,
    "User1",
    "returns user1 using $all with regex"
  );
  t.equal(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (results[1] as UserResult).user.username,
    "User2",
    "returns user2 using $all with regex"
  );
});

test("Match $all with strings, numbers and empty lists", (t) => {
  t.plan(3);

  const data = [
    {
      user: {
        username: "User1",
        projects: ["foo", 1],
      },
    },
    {
      user: {
        username: "User2",
        projects: ["foo", 2, "1"],
      },
    },
    {
      user: {
        username: "User3",
        projects: [],
      },
    },
  ];
  const criteria = {
    "user.projects": {
      $all: ["foo", 1],
    },
  };
  // It should return two user objects
  const results = find(data, criteria).all();

  t.equal(results.length, 1, "can match using $all with strings and numbers");
  t.equal(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (results[0] as UserResult).user.username,
    "User1",
    "returns user1 using $all with strings and numbers"
  );

  criteria["user.projects"].$all = [];

  t.equal(
    find(data, criteria).count(),
    0,
    "match $all with an empty query returns no items"
  );
});

test("Query $elemMatch operator", (t) => {
  let result = find(
    [
      { _id: 1, results: [82, 85, 88] },
      { _id: 2, results: [75, 88, 89] },
    ],
    { results: { $elemMatch: { $gte: 80, $lt: 85 } } }
  ).all()[0];

  t.deepEqual(
    result,
    { _id: 1, results: [82, 85, 88] },
    "simple $elemMatch query"
  );

  const products = [
    {
      _id: 1,
      results: [
        { product: "abc", score: 10 },
        { product: "xyz", score: 5 },
      ],
    },
    {
      _id: 2,
      results: [
        { product: "abc", score: 8 },
        { product: "xyz", score: 7 },
      ],
    },
    {
      _id: 3,
      results: [
        { product: "abc", score: 7 },
        { product: "xyz", score: 8 },
      ],
    },
  ];
  result = find(products, {
    results: { $elemMatch: { product: "xyz", score: { $gte: 8 } } },
  }).all()[0];

  t.deepEqual(
    result,
    {
      _id: 3,
      results: [
        { product: "abc", score: 7 },
        { product: "xyz", score: 8 },
      ],
    },
    "$elemMatch on embedded documents"
  );

  result = find(products, {
    results: { $elemMatch: { product: "xyz" } },
  }).all();
  t.deepEqual(result, products, "$elemMatch single document");

  // Test for https://github.com/kofrasa/mingo/issues/103
  const fixtures = [
    [{ $eq: 50 }],
    [{ $lt: 50 }],
    [{ $lte: 50 }],
    [{ $gt: 50 }],
    [{ $gte: 50 }],
  ];

  fixtures.forEach(function (args) {
    const query = new Query({ scores: { $elemMatch: args[0] } });
    const op = Object.keys(args[0])[0];
    // test if an object matches query
    t.ok(
      query.test({ scores: [10, 50, 100] }),
      "$elemMatch: should filter with " + op
    );
  });

  t.end();
});

test("Query $elemMatch operator with non-boolean operators", (t) => {
  const products = [
    {
      _id: 3,
      results: [
        { product: "abc", score: 7 },
        { product: "xyz", score: 8 },
      ],
    },
  ];

  let result = find(products, {
    results: {
      $elemMatch: {
        $and: [{ product: "xyz" }, { score: 8 }],
      },
    },
  }).all()[0];

  t.deepEqual(
    result,
    {
      _id: 3,
      results: [
        { product: "abc", score: 7 },
        { product: "xyz", score: 8 },
      ],
    },
    "$elemMatch with $and"
  );

  result = find(products, {
    results: {
      $elemMatch: {
        $and: [{ product: "xyz" }, { score: 9 }],
      },
    },
  }).all()[0];

  t.deepEqual(result, undefined, "$elemMatch with $and that does not match");

  result = find(products, {
    results: {
      $elemMatch: {
        $or: [{ product: "xyz" }, { score: 8 }],
      },
    },
  }).all()[0];

  t.deepEqual(
    result,
    {
      _id: 3,
      results: [
        { product: "abc", score: 7 },
        { product: "xyz", score: 8 },
      ],
    },
    "$elemMatch with $or"
  );

  result = find(products, {
    results: {
      $elemMatch: {
        $nor: [{ product: "abc" }, { score: 7 }],
      },
    },
  }).all()[0];

  t.deepEqual(
    result,
    {
      _id: 3,
      results: [
        { product: "abc", score: 7 },
        { product: "xyz", score: 8 },
      ],
    },
    "$elemMatch with $nor"
  );

  t.end();
});
