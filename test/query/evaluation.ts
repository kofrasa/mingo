import "../../src/init/system";

import Ajv, { Schema } from "ajv";
import test from "tape";

import { aggregate, find } from "../../src";
import {
  JsonSchemaValidator,
  OperatorType,
  useOperators,
} from "../../src/core";
import { $where } from "../../src/operators/query/evaluation/where";
import { RawArray, RawObject } from "../../src/types";

useOperators(OperatorType.QUERY, { $where });

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
    const res = find(data, arr[0] as RawObject).all();
    t.deepEqual(res, arr[1], arr[2] as string);
  }

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

test("$rand", (t) => {
  const data = [
    { name: "Archibald", voterId: 4321, district: 3, registered: true },
    { name: "Beckham", voterId: 4331, district: 3, registered: true },
    { name: "Carolin", voterId: 5321, district: 4, registered: true },
    { name: "Debarge", voterId: 4343, district: 3, registered: false },
    { name: "Eckhard", voterId: 4161, district: 3, registered: false },
    { name: "Faberge", voterId: 4300, district: 1, registered: true },
    { name: "Grimwald", voterId: 4111, district: 3, registered: true },
    { name: "Humphrey", voterId: 2021, district: 3, registered: true },
    { name: "Idelfon", voterId: 1021, district: 4, registered: true },
    { name: "Justo", voterId: 9891, district: 3, registered: false },
  ];
  const q = () =>
    find(
      data,
      { district: 3, $expr: { $lt: [0.5, { $rand: {} }] } },
      { _id: 0, name: 1, registered: 1 }
    ).all();

  t.notDeepEqual(q(), q(), "returns random objects");

  t.end();
});

test("Query: $jsonSchema", (t) => {
  const docs = [
    {
      item: "journal",
      qty: 25,
      size: { h: 14, w: 21, uom: "cm" },
      instock: true,
    },
    {
      item: "notebook",
      qty: 50,
      size: { h: 8.5, w: 11, uom: "in" },
      instock: true,
    },
    { item: "paper", qty: 100, size: { h: 8.5, w: 11, uom: "in" }, instock: 1 },
    {
      item: "planner",
      qty: 75,
      size: { h: 22.85, w: 30, uom: "cm" },
      instock: 1,
    },
    {
      item: "postcard",
      qty: 45,
      size: { h: 10, w: 15.25, uom: "cm" },
      instock: true,
    },
    { item: "apple", qty: 45, status: "A", instock: true },
    { item: "pears", qty: 50, status: "A", instock: true },
  ];

  const schema = {
    type: "object",
    required: ["item", "qty", "instock"],
    properties: {
      item: { type: "string" },
      qty: { type: "integer" },
      size: {
        type: "object",
        required: ["uom"],
        properties: {
          uom: { type: "string" },
          h: { type: "number" },
          w: { type: "number" },
        },
      },
      instock: { type: "boolean" },
    },
  };

  const jsonSchemaValidator: JsonSchemaValidator = (s: RawObject) => {
    const ajv = new Ajv();
    const v = ajv.compile(s as Schema);
    return (o: RawObject) => (v(o) ? true : false);
  };

  const options = { jsonSchemaValidator };

  let result = find(docs, { $jsonSchema: schema }, {}, options).all();
  t.equal(result.length, 5, "matches with $jsonSchema in query");

  result = aggregate(docs, [{ $match: { $jsonSchema: schema } }], options);
  t.equal(result.length, 5, "matches with $jsonSchema in aggregation");

  try {
    find(docs, { $jsonSchema: schema }, {});
    t.ok(false, "must throw exception");
  } catch (err: unknown) {
    t.match(
      err?.toString(),
      /Missing option 'jsonSchemaValidator'/,
      "throws error on invalid JsonSchemaValidator"
    );
  }

  t.end();
});
