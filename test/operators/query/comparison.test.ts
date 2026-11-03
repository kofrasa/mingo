import { describe, expect, it } from "vitest";

import { find, Query } from "../../../src";
import { Any, AnyObject } from "../../../src/types";
import { DEFAULT_OPTS, ObjectId, personData } from "../../support";

const objectId = ObjectId("123456789abe");
const obj = Object.assign({}, personData, { _id: objectId });

describe("operators/query/comparison", () => {
  const queries = [
    [{ _id: objectId }, "can match against user-defined types"],
    [{ firstName: "Francis" }, "can check for equality with $eq"],
    [{ lastName: /^a.+e/i }, "can check against regex with literal"],
    [
      { lastName: { $regex: "a.+e", $options: "i" } },
      "can check against regex with $regex operator"
    ],
    [{ username: { $not: "mufasa" } }, "can apply $not to direct values"],
    [
      { username: { $not: { $ne: "kofrasa" } } },
      "can apply $not to sub queries"
    ],
    [{ jobs: { $gt: 1 } }, "can compare with $gt"],
    [{ jobs: { $gte: 6 } }, "can compare with $gte"],
    [{ jobs: { $lt: 10 } }, "can compare with $lt"],
    [{ jobs: { $lte: 6 } }, "can compare with $lte"],
    [
      { middlename: { $exists: false } },
      "can check if value does not exists with $exists"
    ],
    [{ projects: { $exists: true } }, "can check if value exists with $exists"],
    [
      { "projects.C.1": "student_record" },
      "can compare value inside array at a given index"
    ],
    [
      { "circles.school": { $in: ["Henry"] } },
      "can check that value is in array with $in"
    ],
    [
      { middlename: { $in: [null, "David"] } },
      "can check if value does not exist with $in"
    ],
    [
      { "circles.family": { $nin: ["Pamela"] } },
      "can check that value is not in array with $nin"
    ],
    [{ firstName: { $nin: [null] } }, "can check if value exists with $nin"],
    [
      { "languages.programming": { $size: 7 } },
      "can determine size of nested array with $size"
    ],
    [{ "projects.Python": "Flaskapp" }, "can match nested elements in array"],
    [{ "date.month": { $mod: [8, 1] } }, "can find modulo of values with $mod"],
    [
      { "languages.spoken": { $all: ["french", "english"] } },
      "can check that all values exists in array with $all"
    ],
    [
      { "languages.spoken": { $all: [/french/, /english/] } },
      "can check that all values exists in array with $all using regex"
    ],
    [
      { date: { year: 2013, month: 9, day: 25 } },
      "can match field with object values"
    ],
    [
      { "grades.0.grade": 92 },
      "can match fields for objects in a given position in an array with dot notation"
    ],
    [
      { "grades.mean": { $gt: 70 } },
      "can match fields for all objects within an array with dot notation"
    ],
    [
      { grades: { $elemMatch: { mean: { $gt: 70 } } } },
      "can match fields for all objects within an array with $elemMatch"
    ],
    [{ today: { $type: 9 } }, "can match type of fields with $type"],
    [
      {
        $where: function () {
          return (
            (this as unknown as { jobs: number }).jobs === 6 &&
            (this as unknown as { grades: unknown[] }).grades.length < 10
          );
        }
      },
      "can match with $where expression"
    ]
  ];

  queries.forEach((q: Any[]) => {
    const [criteria, message] = q;
    const query = new Query(criteria as AnyObject, DEFAULT_OPTS);
    it(message as string, () => {
      expect(query.test(obj)).toEqual(true);
    });
  });

  it("can match null and missing types correctly", () => {
    //https://github.com/kofrasa/mingo/issues/54
    const data = [{ _id: 1, item: null }, { _id: 2 }];
    const result = find(data, { item: null }, {}, DEFAULT_OPTS).all();
    expect(result).toEqual(data);
  });

  describe("$mod", () => {
    // https://www.mongodb.com/docs/manual/reference/operator/query/mod/
    // only numeric field values (or numeric array elements) can match.
    const query = new Query({ a: { $mod: [5, 0] } }, DEFAULT_OPTS);

    it.each([
      ["null", { a: null }],
      ["missing field", {}],
      ["numeric string", { a: "10" }],
      ["empty string", { a: "" }],
      ["true", { a: true }],
      ["false", { a: false }],
      ["date", { a: new Date(10) }],
      ["NaN", { a: NaN }],
      ["Infinity", { a: Infinity }],
      ["empty array", { a: [] }],
      ["array with null and non-matching number", { a: [null, 3] }],
      ["array with non-numeric values", { a: ["10", false, null] }],
      ["nested array", { a: [[10]] }],
      ["nested empty array", { a: [[]] }]
    ])("does not match non-numeric value: %s", (_, doc) => {
      expect(query.test(doc as AnyObject)).toEqual(false);
    });

    it.each([
      ["number", { a: 10 }],
      ["zero", { a: 0 }],
      ["negative number", { a: -10 }],
      ["array with matching number", { a: [5] }],
      ["array with null and matching number", { a: [null, 3, 10] }]
    ])("matches numeric value: %s", (_, doc) => {
      expect(query.test(doc as AnyObject)).toEqual(true);
    });

    it("does not match booleans coerced to numbers", () => {
      const q = new Query({ a: { $mod: [1, 0] } }, DEFAULT_OPTS);
      expect(q.test({ a: true })).toEqual(false);
      expect(q.test({ a: false })).toEqual(false);
      expect(q.test({ a: 3 })).toEqual(true);
    });

    it("filters mixed documents", () => {
      const docs = [
        { a: null },
        { a: "10" },
        { a: true },
        { a: false },
        { a: 10 },
        { a: [null, 3] },
        { a: [5] },
        {}
      ];
      expect(
        find(docs, { a: { $mod: [5, 0] } }, {}, DEFAULT_OPTS).all()
      ).toEqual([{ a: 10 }, { a: [5] }]);
    });
  });

  it("can match non-primitive values with $in", () => {
    const data = [
      { _id: 1, tags: [[1, 2]] },
      { _id: 2, tags: [[3, 4]] },
      { _id: 3, tags: [[5, 6]] }
    ];
    const result = find(
      data,
      {
        tags: {
          $in: [
            [1, 2],
            [5, 6]
          ]
        }
      },
      {},
      DEFAULT_OPTS
    ).all();
    expect(result).toEqual([
      { _id: 1, tags: [[1, 2]] },
      { _id: 3, tags: [[5, 6]] }
    ]);
  });
});
