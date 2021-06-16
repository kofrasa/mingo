import test from "tape";

import { find, Query } from "../src";
import { OperatorType, useOperators } from "../src/core";
import { $where } from "../src/operators/query/evaluation/where";
import { Collection, RawArray, RawObject } from "../src/types";
import * as samples from "./support";

class ObjectId {
  constructor(readonly _id: string) {}
}

const idStr = "123456789abe";
const obj = Object.assign({}, samples.personData, { _id: new ObjectId(idStr) });

useOperators(OperatorType.QUERY, { $where });

test("Comparison, Evaluation, and Element Operators", (t) => {
  const queries = [
    [{ _id: new ObjectId(idStr) }, "can match against user-defined types"],
    [{ firstName: "Francis" }, "can check for equality with $eq"],
    [{ lastName: /^a.+e/i }, "can check against regex with literal"],
    [
      { lastName: { $regex: "a.+e", $options: "i" } },
      "can check against regex with $regex operator",
    ],
    [{ username: { $not: "mufasa" } }, "can apply $not to direct values"],
    [
      { username: { $not: { $ne: "kofrasa" } } },
      "can apply $not to sub queries",
    ],
    [{ jobs: { $gt: 1 } }, "can compare with $gt"],
    [{ jobs: { $gte: 6 } }, "can compare with $gte"],
    [{ jobs: { $lt: 10 } }, "can compare with $lt"],
    [{ jobs: { $lte: 6 } }, "can compare with $lte"],
    [
      { middlename: { $exists: false } },
      "can check if value does not exists with $exists",
    ],
    [{ projects: { $exists: true } }, "can check if value exists with $exists"],
    [
      { "projects.C.1": "student_record" },
      "can compare value inside array at a given index",
    ],
    [
      { "circles.school": { $in: ["Henry"] } },
      "can check that value is in array with $in",
    ],
    [
      { middlename: { $in: [null, "David"] } },
      "can check if value does not exist with $in",
    ],
    [
      { "circles.family": { $nin: ["Pamela"] } },
      "can check that value is not in array with $nin",
    ],
    [{ firstName: { $nin: [null] } }, "can check if value exists with $nin"],
    [
      { "languages.programming": { $size: 7 } },
      "can determine size of nested array with $size",
    ],
    [{ "projects.Python": "Flaskapp" }, "can match nested elements in array"],
    [{ "date.month": { $mod: [8, 1] } }, "can find modulo of values with $mod"],
    [
      { "languages.spoken": { $all: ["french", "english"] } },
      "can check that all values exists in array with $all",
    ],
    [
      { date: { year: 2013, month: 9, day: 25 } },
      "can match field with object values",
    ],
    [
      { "grades.0.grade": 92 },
      "can match fields for objects in a given position in an array with dot notation",
    ],
    [
      { "grades.mean": { $gt: 70 } },
      "can match fields for all objects within an array with dot notation",
    ],
    [
      { grades: { $elemMatch: { mean: { $gt: 70 } } } },
      "can match fields for all objects within an array with $elemMatch",
    ],
    [{ today: { $type: 9 } }, "can match type of fields with $type"],
    [
      { $where: "this.jobs === 6 && this.grades.length < 10" },
      "can match with $where expression",
    ],
  ];

  queries.forEach((q: RawArray) => {
    const query = new Query(q[0] as RawObject);
    t.ok(query.test(obj), q[1] as string);
  });

  //https://github.com/kofrasa/mingo/issues/54
  const data = [{ _id: 1, item: null }, { _id: 2 }];
  const result = find(data, { item: null }).all();
  t.deepEqual(result, data, "can match null and missing types correctly");

  t.end();
});

test("project $type operator", (t) => {
  const obj = {
    double: 12323.4,
    string: "me",
    obj: {},
    array: [],
    boolean: true,
    date: new Date(),
    nothing: null,
    regex: /ab/,
    int: 49023,
    long: Math.pow(2, 32),
    decimal: 20.7823e10,
  };
  const queries = [
    [{ double: { $type: 1 } }, 'can match $type 1 "double"'],
    [{ string: { $type: 2 } }, 'can match $type 2 "string"'],
    [{ obj: { $type: 3 } }, 'can match $type 3 "object"'],
    [{ array: { $type: 4 } }, 'can match $type 4 "array"'],
    [{ missing: { $type: 6 } }, 'can match $type 6 "undefined"'],
    [{ boolean: { $type: 8 } }, 'can match $type 8 "boolean"'],
    [{ date: { $type: 9 } }, 'can match $type 9 "date"'],
    [{ nothing: { $type: 10 } }, 'can match $type 10 "null"'],
    [{ regex: { $type: 11 } }, 'can match $type 11 "regexp"'],
    [{ int: { $type: 16 } }, 'can match $type 16 "int"'],
    [{ long: { $type: 18 } }, 'can match $type 18 "long"'],
    [{ decimal: { $type: 19 } }, 'can match $type 19 "decimal"'],
    [{ obj: { $not: { $type: 100 } } }, "do not match unknown $type"],
    // { $type: array }
    [{ double: { $type: [1] } }, 'can match $type [1] "double"'],
    [{ double: { $type: [1, 4] } }, 'can match $type [1, 4] "double"'],
    [{ array: { $type: [1, 4] } }, 'can match $type [1, 4] "array"'],
    [{ double: { $not: { $type: [] } } }, "do not match $type []"],
  ];

  queries.forEach(function (q) {
    const query = new Query(q[0] as RawObject);
    t.ok(query.test(obj), q[1] as string);
  });

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

test("Projection $elemMatch operator", (t) => {
  const data = [
    {
      _id: 1,
      zipcode: "63109",
      students: [
        { name: "john", school: 102, age: 10 },
        { name: "jess", school: 102, age: 11 },
        { name: "jeff", school: 108, age: 15 },
      ],
    },
    {
      _id: 2,
      zipcode: "63110",
      students: [
        { name: "ajax", school: 100, age: 7 },
        { name: "achilles", school: 100, age: 8 },
      ],
    },
    {
      _id: 3,
      zipcode: "63109",
      students: [
        { name: "ajax", school: 100, age: 7 },
        { name: "achilles", school: 100, age: 8 },
      ],
    },
    {
      _id: 4,
      zipcode: "63109",
      students: [
        { name: "barney", school: 102, age: 7 },
        { name: "ruth", school: 102, age: 16 },
      ],
    },
  ];

  const result1 = find(
    data,
    { zipcode: "63109" },
    { students: { $elemMatch: { school: 102 } } }
  ).all();
  t.deepEqual(
    result1,
    [
      { _id: 1, students: [{ name: "john", school: 102, age: 10 }] },
      { _id: 3 },
      { _id: 4, students: [{ name: "barney", school: 102, age: 7 }] },
    ],
    "can project with $elemMatch"
  );

  const result2 = find(
    data,
    { zipcode: "63109" },
    { students: { $elemMatch: { school: 102, age: { $gt: 10 } } } }
  ).all();
  t.deepEqual(
    result2,
    [
      { _id: 1, students: [{ name: "jess", school: 102, age: 11 }] },
      { _id: 3 },
      { _id: 4, students: [{ name: "ruth", school: 102, age: 16 }] },
    ],
    "can project multiple fields with $elemMatch"
  );

  const result3 = find(data, {}, { students: { $slice: 1 } }).all()[0] as {
    students: RawArray;
  };
  t.equal(result3.students.length, 1, "can project $slice with limit");

  const result4 = find(data, {}, { students: { $slice: [1, 2] } }).all()[0] as {
    students: RawArray;
  };
  t.equal(result4.students.length, 2, "can project $slice with skip and limit");

  t.end();
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

test("Evaluate $where last", (t) => {
  t.plan(2);

  const data = [
    {
      user: {
        username: "User1",
        projects: [
          { name: "Project 1", rating: { complexity: 6 } },
          { name: "Project 2", rating: { complexity: 2 } },
        ],
        color: "green",
        number: 42,
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

  let criteria: RawObject = {
    "user.color": { $exists: true },
    "user.number": { $exists: true },
    $where: 'this.user.color === "green" && this.user.number === 42',
  };
  // It should return one user object
  let result = find(data, criteria).count();
  t.ok(
    result === 1,
    "can safely reference properties on this using $where and $exists"
  );

  criteria = {
    "user.color": { $exists: true },
    "user.number": { $exists: true },
    $and: [
      { $where: 'this.user.color === "green"' },
      { $where: "this.user.number === 42" },
    ],
  };
  // It should return one user object
  result = find(data, criteria).count();
  t.ok(
    result === 1,
    "can safely reference properties on this using multiple $where operators and $exists"
  );
});

test("Query projection operators", (t) => {
  {
    const data: Collection = [obj];
    const result = find(
      data,
      {},
      { "languages.programming": { $slice: [-3, 2] } }
    ).next() as typeof samples.personData;
    t.deepEqual(
      result["languages"]["programming"],
      ["Javascript", "Bash"],
      "should project with $slice operator"
    );
  }

  {
    // special tests
    // https://github.com/kofrasa/mingo/issues/25
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

    const expected = {
      key0: [{ key1: [[[{ key2: [{ a: "value2" }, { a: "dummy" }] }]]] }],
    };

    const result = find(
      data,
      { "key0.key1.key2": "value" },
      { "key0.key1.key2.a": 1 }
    ).next();
    t.deepEqual(
      result,
      expected,
      "should project only selected object graph from nested arrays"
    );
    t.notDeepEqual(data[0], result, "should not modify original");
  }

  {
    const data = [
      { name: "Steve", age: 15, features: { hair: "brown", eyes: "brown" } },
    ];
    let result = find(data, {}, { "features.hair": 1 }).next();
    t.deepEqual(
      result,
      { features: { hair: "brown" } },
      "should project only selected object graph"
    );
    t.notDeepEqual(data[0], result, "should not modify original");

    t.throws(
      function () {
        find(data, {}, { "features.hair": 0, name: 1 }).next();
      },
      Error,
      "should throw exception: Projection cannot have a mix of inclusion and exclusion"
    );

    result = find(data, {}, { "features.hair": 0 }).next();
    t.deepEqual(
      result,
      { name: "Steve", age: 15, features: { eyes: "brown" } },
      "should omit key"
    );
    t.notDeepEqual(data[0], result, "should not modify original");
  }

  {
    const data = [
      { name: "Steve", age: 15, features: ["hair", "eyes", "nose"] },
    ];
    let result = find(data, {}, { "features.1": 0 }).next();
    t.deepEqual(
      result,
      { name: "Steve", age: 15, features: ["hair", "nose"] },
      "should omit second element in array"
    );
    t.notDeepEqual(data[0], result, "should not modify original");

    result = find(data, {}, { "features.1": 1 }).next();
    t.deepEqual(
      result,
      { features: ["eyes"] },
      "should select only second element in array"
    );
    t.notDeepEqual(data[0], result, "should not modify original");

    result = find(
      [
        { id: 1, sub: [{ id: 11, name: "OneOne", test: true }] },
        { id: 2, sub: [{ id: 22, name: "TwoTwo", test: false }] },
      ],
      {},
      { "sub.id": 1, "sub.name": 1 }
    ).next();
    t.deepEqual(
      result,
      { sub: [{ id: 11, name: "OneOne" }] },
      "should project nested elements in array"
    );
  }

  t.end();
});

test("Logical Operators", (t) => {
  const queries: Array<RawArray> = [
    [
      { $and: [{ firstName: "Francis" }, { lastName: /^a.+e/i }] },
      "can use conjunction true AND true",
    ],
    [
      { $and: [{ firstName: "Francis" }, { lastName: "Amoah" }] },
      false,
      "can use conjunction true AND false",
    ],
    [
      { $and: [{ firstName: "Enoch" }, { lastName: "Asante" }] },
      false,
      "can use conjunction false AND true",
    ],
    [
      { $and: [{ firstName: "Enoch" }, { age: { $exists: true } }] },
      false,
      "can use conjunction false AND false",
    ],
    // or
    [
      { $or: [{ firstName: "Francis" }, { lastName: /^a.+e/i }] },
      "can use conjunction true OR true",
    ],
    [
      { $or: [{ firstName: "Francis" }, { lastName: "Amoah" }] },
      "can use conjunction true OR false",
    ],
    [
      { $or: [{ firstName: "Enoch" }, { lastName: "Asante" }] },
      "can use conjunction false OR true",
    ],
    [
      { $or: [{ firstName: "Enoch" }, { age: { $exists: true } }] },
      false,
      "can use conjunction false OR false",
    ],
    // nor
    [
      { $nor: [{ firstName: "Francis" }, { lastName: /^a.+e/i }] },
      false,
      "can use conjunction true NOR true",
    ],
    [
      { $nor: [{ firstName: "Francis" }, { lastName: "Amoah" }] },
      false,
      "can use conjunction true NOR false",
    ],
    [
      { $nor: [{ firstName: "Enoch" }, { lastName: "Asante" }] },
      false,
      "can use conjunction false NOR true",
    ],
    [
      { $nor: [{ firstName: "Enoch" }, { age: { $exists: true } }] },
      "can use conjunction false NOR false",
    ],
  ];

  queries.forEach(function (q) {
    if (q.length === 2) {
      t.ok(new Query(q[0] as RawObject).test(obj), q[1] as string);
    } else if (q.length === 3) {
      t.equal(new Query(q[0] as RawObject).test(obj), q[1], q[2] as string);
    }
  });

  t.end();
});

test("Query array operators", (t) => {
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

test("$regex test", (t) => {
  // no regex - returns expected list: 1 element - ok
  const res: Array<RawArray> = [];
  res.push(
    find([{ l1: [{ tags: ["tag1", "tag2"] }, { notags: "yep" }] }], {
      "l1.tags": "tag1",
    }).all()
  );

  // with regex - but searched property is not an array: ok
  res.push(
    find([{ l1: [{ tags: "tag1" }, { notags: "yep" }] }], {
      "l1.tags": { $regex: ".*tag.*", $options: "i" },
    }).all()
  );

  // with regex - but searched property is an array, with all elements matching: not ok - expected 1, returned 0
  res.push(
    find([{ l1: [{ tags: ["tag1", "tag2"] }, { tags: ["tag66"] }] }], {
      "l1.tags": { $regex: "tag", $options: "i" },
    }).all()
  );

  // with regex - but searched property is an array, only one element matching: not ok - returns 0 elements - expected 1
  res.push(
    find([{ l1: [{ tags: ["tag1", "tag2"] }, { notags: "yep" }] }], {
      "l1.tags": { $regex: "tag", $options: "i" },
    }).all()
  );

  t.ok(
    res.every((x) => x.length === 1),
    "can $regex match nested values"
  );

  t.end();
});

test("$expr tests", (t) => {
  // https://docs.mongodb.com/manual/reference/operator/query/expr/

  let res = find(
    [
      { _id: 1, category: "food", budget: 400, spent: 450 },
      { _id: 2, category: "drinks", budget: 100, spent: 150 },
      { _id: 3, category: "clothes", budget: 100, spent: 50 },
      { _id: 4, category: "misc", budget: 500, spent: 300 },
      { _id: 5, category: "travel", budget: 200, spent: 650 },
    ],
    { $expr: { $gt: ["$spent", "$budget"] } }
  ).all();

  t.deepEqual(
    res,
    [
      { _id: 1, category: "food", budget: 400, spent: 450 },
      { _id: 2, category: "drinks", budget: 100, spent: 150 },
      { _id: 5, category: "travel", budget: 200, spent: 650 },
    ],
    "compare two fields from a single document"
  );

  res = find(
    [
      { _id: 1, item: "binder", qty: 100, price: 12 },
      { _id: 2, item: "notebook", qty: 200, price: 8 },
      { _id: 3, item: "pencil", qty: 50, price: 6 },
      { _id: 4, item: "eraser", qty: 150, price: 3 },
    ],
    {
      $expr: {
        $lt: [
          {
            $cond: {
              if: { $gte: ["$qty", 100] },
              then: { $divide: ["$price", 2] },
              else: { $divide: ["$price", 4] },
            },
          },
          5,
        ],
      },
    }
  ).all();

  t.deepEqual(
    res,
    [
      { _id: 2, item: "notebook", qty: 200, price: 8 },
      { _id: 3, item: "pencil", qty: 50, price: 6 },
      { _id: 4, item: "eraser", qty: 150, price: 3 },
    ],
    "using $expr with conditional statements"
  );

  t.end();
});

test("null or missing fields", (t) => {
  const data = [{ _id: 1, item: null }, { _id: 2 }];
  const fixtures: RawArray = [
    // query, result, message
    [
      { item: null },
      [{ _id: 1, item: null }, { _id: 2 }],
      "should return all documents",
    ],
    [
      { item: { $type: 10 } },
      [{ _id: 1, item: null }],
      "should return one document with null field",
    ],
    [
      { item: { $exists: false } },
      [{ _id: 2 }],
      "should return one document without null field",
    ],
    [
      { item: { $in: [null, false] } },
      [{ _id: 1, item: null }, { _id: 2 }],
      "$in should return all documents",
    ],
  ];
  for (let i = 0; i < fixtures.length; i++) {
    const arr = fixtures[i];
    const res = find(data, arr[0]).all();
    t.deepEqual(res, arr[1], arr[2]);
  }
  t.end();
});

test("hash function collision", (t) => {
  const data = [{ codes: ["KNE_OC42-midas"] }, { codes: ["KNE_OCS3-midas"] }];
  const fixtures = [
    {
      query: { codes: { $in: ["KNE_OCS3-midas"] } },
      result: [{ codes: ["KNE_OC42-midas"] }, { codes: ["KNE_OCS3-midas"] }],
      options: {},
      message:
        "should return both documents due to hash collision with default hash function",
    },
    {
      query: { codes: { $in: ["KNE_OCS3-midas"] } },
      result: [{ codes: ["KNE_OCS3-midas"] }],
      options: {
        hashFunction: (v) => JSON.stringify(v), // basic hash function, but has low performances
      },
      message:
        "should return the good document due to no hash collision with custom hash function",
    },
  ];
  for (let i = 0; i < fixtures.length; i++) {
    const line = fixtures[i];
    const query = new Query(line.query, line.options);
    const res = query.find(data).all();
    t.deepEqual(res, line.result, line.message);
  }
  t.end();
});
