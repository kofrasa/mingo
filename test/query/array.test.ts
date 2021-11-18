import "../../src/init/system";

import { find, Query } from "../../src";
import { RawArray, RawObject } from "../../src/types";

interface UserResult {
  user: { username: string };
}

describe("query/array", () => {
  const data: Array<RawObject> = [
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

  it("can match object using $all with $elemMatch", () => {
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

    expect(booleanResult).toEqual(true);
  });

  describe("matching with field selectors", () => {
    const data = [
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

    const fixtures: Array<RawArray> = [
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
        "can match with full array index selector to deeply nested value",
      ],
      [
        { "key0.key1.0.0.key2": { b: 20 } },
        data,
        "can match with array index selector to nested value at depth 1",
      ],
      [
        { "key0.key1.1.key2": "value" },
        data,
        "can match with full array index selector to nested value",
      ],
      [
        { "key0.key1.key2": "value" },
        data,
        "can match without array index selector to nested value at depth 1",
      ],
      [
        { "key0.key1.1.key2": "value" },
        data,
        "can match shallow nested value with array index selector",
      ],
    ];

    fixtures.forEach((row: RawArray) => {
      const query = row[0] as RawObject;
      const expected = row[1];
      const message = row[2] as string;
      it(message, () => {
        const result = find(data, query).all();
        expect(result).toEqual(expected);
      });
    });

    // should match whole objects
    [
      [
        {
          "key0.key1": [
            [{ key2: [{ a: "value2" }, { a: "dummy" }, { b: 20 }] }],
          ],
        },
        "can match full key selector",
      ],
      [
        {
          "key0.key1.0": [
            [{ key2: [{ a: "value2" }, { a: "dummy" }, { b: 20 }] }],
          ],
        },
        "can match with key<-->index selector",
      ],
      [
        {
          "key0.key1.0.0": [
            { key2: [{ a: "value2" }, { a: "dummy" }, { b: 20 }] },
          ],
        },
        "can match with key<-->multi-index selector",
      ],
      [
        { "key0.key1.0.0.key2": [{ a: "value2" }, { a: "dummy" }, { b: 20 }] },
        "can match with key<-->multi-index<-->key selector",
      ],
    ].forEach(function (row) {
      const query = row[0] as RawObject;
      const message = row[1] as string;
      const result = find(data, query) as Iterable<RawObject>;

      it(message, () => {
        // using iterator
        expect(Array.from(result)).toEqual(data);
        expect(Array.from(result).length).toEqual(0);
      });
    });
  });

  it("can match nested array of objects without indices", () => {
    // https://github.com/kofrasa/mingo/issues/51
    const data = [{ key0: [{ key1: ["value"] }, { key1: ["value1"] }] }];
    const singleResult = find(data, { "key0.key1": { $eq: "value" } }).next();
    expect(singleResult).toEqual(data[0]);
  });

  it("can project all matched elements of nested array", () => {
    // https://github.com/kofrasa/mingo/issues/93
    const data = [
      {
        id: 1,
        sub: [
          { id: 11, name: "OneOne", test: true },
          { id: 22, name: "TwoTwo", test: false },
        ],
      },
    ];

    const arrayResult = find(data, {}, { "sub.id": 1, "sub.name": 1 }).all();
    expect(arrayResult).toEqual([
      {
        sub: [
          { id: 11, name: "OneOne" },
          { id: 22, name: "TwoTwo" },
        ],
      },
    ]);
  });

  it("can project multiple nested elements", () => {
    // https://github.com/kofrasa/mingo/issues/105 - fix merging distinct objects during projection
    const result = find(
      [{ items: [{ from: 1 }, { to: 2 }] }],
      {},
      { "items.from": 1, "items.to": 1 }
    ).all();
    expect(result).toEqual([{ items: [{ from: 1 }, { to: 2 }] }]);
  });

  it("can project multiple nested elements with missing keys", () => {
    // extended test for missing keys of nested values
    const result = find(
      [{ items: [{ from: 1, to: null }, { to: 2 }] }],
      {},
      { "items.from": 1, "items.to": 1 }
    ).all();
    expect(result).toEqual([{ items: [{ from: 1, to: null }, { to: 2 }] }]);
  });

  it("can project multiple nested objects with missing keys and matched out of order", () => {
    // https://github.com/kofrasa/mingo/issues/106 - fix nested elements splitting after projection due to out of order matching
    const result = find(
      [{ history: [{ user: "Jeff", notes: "asdf" }, { user: "Gary" }] }],
      {},
      {
        "history.user": 1,
        "history.notes": 1,
      }
    ).all();

    expect(result).toEqual([
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
    ]);
  });

  it("can match using $all with $elemMatch on nested elements", () => {
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
    expect(result).toEqual(1);
  });

  it("can match $all with regex", () => {
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

    expect(results.length).toEqual(2);
    expect((results[0] as UserResult).user.username).toEqual("User1");
    expect(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (results[1] as UserResult).user.username
    ).toEqual("User2");
  });

  it("can match $all with strings, numbers and empty lists", () => {
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

    expect(results.length).toEqual(1);

    expect(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (results[0] as UserResult).user.username
    ).toEqual("User1");

    criteria["user.projects"].$all = [];
    expect(find(data, criteria).count()).toEqual(0);
  });

  describe("Query $elemMatch operator", () => {
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

    it("can $elemMatch on embedded documents", () => {
      const result = find(products, {
        results: { $elemMatch: { product: "xyz", score: { $gte: 8 } } },
      }).all()[0];

      expect(result).toEqual({
        _id: 3,
        results: [
          { product: "abc", score: 7 },
          { product: "xyz", score: 8 },
        ],
      });
    });

    it("can $elemMatch single document", () => {
      const result = find(products, {
        results: { $elemMatch: { product: "xyz" } },
      }).all();
      expect(result).toEqual(products);
    });

    it("can $elemMatch with comparison operators", () => {
      // Test for https://github.com/kofrasa/mingo/issues/103
      const fixtures = [
        [{ $eq: 50 }],
        [{ $lt: 50 }],
        [{ $lte: 50 }],
        [{ $gt: 50 }],
        [{ $gte: 50 }],
        [{ $gte: 10, $lt: 100 }],
      ];

      fixtures.forEach(function (args) {
        const query = new Query({ scores: { $elemMatch: args[0] } });
        const op = Object.keys(args[0])[0];
        // test if an object matches query
        expect(query.test({ scores: [10, 50, 100] })).toEqual(true);
      });
    });
  });

  describe("$elemMatch with boolean operators", () => {
    const products = [
      {
        _id: 3,
        results: [
          { product: "abc", score: 7 },
          { product: "xyz", score: 8 },
        ],
      },
    ];

    it("$elemMatch with $and", () => {
      let result = find(products, {
        results: {
          $elemMatch: {
            $and: [{ product: "xyz" }, { score: 8 }],
          },
        },
      }).all()[0];

      expect(result).toEqual({
        _id: 3,
        results: [
          { product: "abc", score: 7 },
          { product: "xyz", score: 8 },
        ],
      });

      // non-existing value
      result = find(products, {
        results: {
          $elemMatch: {
            $and: [{ product: "xyz" }, { score: 9 }],
          },
        },
      }).all()[0];

      expect(result).toBeUndefined();
    });

    it("can $elemMatch with $or", () => {
      const result = find(products, {
        results: {
          $elemMatch: {
            $or: [{ product: "xyz" }, { score: 8 }],
          },
        },
      }).all()[0];

      expect(result).toEqual({
        _id: 3,
        results: [
          { product: "abc", score: 7 },
          { product: "xyz", score: 8 },
        ],
      });
    });

    it("can $elemMatch with $nor", () => {
      const result = find(products, {
        results: {
          $elemMatch: {
            $nor: [{ product: "abc" }, { score: 7 }],
          },
        },
      }).all()[0];

      expect(result).toEqual({
        _id: 3,
        results: [
          { product: "abc", score: 7 },
          { product: "xyz", score: 8 },
        ],
      });
    });
  });
});
