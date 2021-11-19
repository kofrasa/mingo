import "../../../src/init/system";

import { find, Query } from "../../../src";
import { OperatorType, useOperators } from "../../../src/core";
import { $where } from "../../../src/operators/query/evaluation/where";
import { RawArray, RawObject } from "../../../src/types";
import { ObjectId, personData } from "../../support";

const idStr = "123456789abe";
const obj = Object.assign({}, personData, { _id: new ObjectId(idStr) });

useOperators(OperatorType.QUERY, { $where });

describe("operators/query/comparison", () => {
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
      { "languages.spoken": { $all: [/french/, /english/] } },
      "can check that all values exists in array with $all using regex",
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
    const [criteria, message] = q;
    const query = new Query(criteria as RawObject);
    it(message as string, () => {
      expect(query.test(obj)).toEqual(true);
    });
  });

  it("can match null and missing types correctly", () => {
    //https://github.com/kofrasa/mingo/issues/54
    const data = [{ _id: 1, item: null }, { _id: 2 }];
    const result = find(data, { item: null }).all();
    expect(result).toEqual(data);
  });
});
