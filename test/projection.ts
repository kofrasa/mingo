import "../src/init/system";

import test from "tape";

import { find } from "../src";
import { Collection, RawArray } from "../src/types";
import * as samples from "./support";

class ObjectId {
  constructor(readonly _id: string) {}
}
const idStr = "123456789abe";
const obj = Object.assign({}, samples.personData, { _id: new ObjectId(idStr) });

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
