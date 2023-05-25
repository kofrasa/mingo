import "../../../src/init/system";

import Ajv, { Schema } from "ajv";

import { aggregate, find } from "../../../src";
import { JsonSchemaValidator } from "../../../src/core";
import { RawArray, RawObject } from "../../../src/types";

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

describe("operators/query/evaluation", () => {
  describe("$where", () => {
    const data = [
      {
        user: {
          username: "User1",
          projects: [
            { name: "Project 1", rating: { complexity: 6 } },
            { name: "Project 2", rating: { complexity: 2 } }
          ],
          color: "green",
          number: 42
        }
      },
      {
        user: {
          username: "User2",
          projects: [
            { name: "Project 1", rating: { complexity: 6 } },
            { name: "Project 2", rating: { complexity: 8 } }
          ]
        }
      }
    ];

    it("can safely reference properties on 'this'", () => {
      const criteria: RawObject = {
        "user.color": { $exists: true },
        "user.number": { $exists: true },
        $where: function () {
          return this.user.color === "green" && this.user.number === 42;
        }
      };

      // It should return one user object
      const result = find(data, criteria).count();
      expect(result).toEqual(1);
    });

    it("can safely reference properties on this using multiple $where operators and $exists", () => {
      const criteria = {
        "user.color": { $exists: true },
        "user.number": { $exists: true },
        $and: [
          {
            $where: function () {
              return this.user.color === "green";
            }
          },
          {
            $where: function () {
              return this.user.number === 42;
            }
          }
        ]
      };
      // It should return one user object
      const result = find(data, criteria).count();
      expect(result).toEqual(1);
    });
  });

  describe("$expr", () => {
    // https://docs.mongodb.com/manual/reference/operator/query/expr/

    it("can compare two fields from a single document", () => {
      const res = find(
        [
          { _id: 1, category: "food", budget: 400, spent: 450 },
          { _id: 2, category: "drinks", budget: 100, spent: 150 },
          { _id: 3, category: "clothes", budget: 100, spent: 50 },
          { _id: 4, category: "misc", budget: 500, spent: 300 },
          { _id: 5, category: "travel", budget: 200, spent: 650 }
        ],
        { $expr: { $gt: ["$spent", "$budget"] } }
      ).all();

      expect(res).toEqual([
        { _id: 1, category: "food", budget: 400, spent: 450 },
        { _id: 2, category: "drinks", budget: 100, spent: 150 },
        { _id: 5, category: "travel", budget: 200, spent: 650 }
      ]);
    });

    it("can use $expr with conditional statements", () => {
      const res = find(
        [
          { _id: 1, item: "binder", qty: 100, price: 12 },
          { _id: 2, item: "notebook", qty: 200, price: 8 },
          { _id: 3, item: "pencil", qty: 50, price: 6 },
          { _id: 4, item: "eraser", qty: 150, price: 3 }
        ],
        {
          $expr: {
            $lt: [
              {
                $cond: {
                  if: { $gte: ["$qty", 100] },
                  then: { $divide: ["$price", 2] },
                  else: { $divide: ["$price", 4] }
                }
              },
              5
            ]
          }
        }
      ).all();

      expect(res).toEqual([
        { _id: 2, item: "notebook", qty: 200, price: 8 },
        { _id: 3, item: "pencil", qty: 50, price: 6 },
        { _id: 4, item: "eraser", qty: 150, price: 3 }
      ]);
    });
  });

  describe("null or missing fields", () => {
    const data = [{ _id: 1, item: null }, { _id: 2 }];
    const fixtures: RawArray = [
      // query, result, message
      [
        { item: null },
        [{ _id: 1, item: null }, { _id: 2 }],
        "should return all documents"
      ],
      [
        { item: { $type: 10 } },
        [{ _id: 1, item: null }],
        "should return one document with null field"
      ],
      [
        { item: { $exists: false } },
        [{ _id: 2 }],
        "should return one document without null field"
      ],
      [
        { item: { $in: [null, false] } },
        [{ _id: 1, item: null }, { _id: 2 }],
        "$in should return all documents"
      ]
    ];

    for (let i = 0; i < fixtures.length; i++) {
      const [criteria, result, message] = fixtures[i] as RawArray;
      it(message as string, () => {
        const res = find(data, criteria as RawObject).all();
        expect(res).toEqual(result);
      });
    }
  });

  describe("$regex", () => {
    // no regex - returns expected list: 1 element - ok
    const res: Array<RawArray> = [];
    res.push(
      find([{ l1: [{ tags: ["tag1", "tag2"] }, { notags: "yep" }] }], {
        "l1.tags": "tag1"
      }).all()
    );

    // with regex - but searched property is not an array: ok
    res.push(
      find([{ l1: [{ tags: "tag1" }, { notags: "yep" }] }], {
        "l1.tags": { $regex: ".*tag.*", $options: "i" }
      }).all()
    );

    // with regex - but searched property is an array, with all elements matching: not ok - expected 1, returned 0
    res.push(
      find([{ l1: [{ tags: ["tag1", "tag2"] }, { tags: ["tag66"] }] }], {
        "l1.tags": { $regex: "tag", $options: "i" }
      }).all()
    );

    // with regex - but searched property is an array, only one element matching: not ok - returns 0 elements - expected 1
    res.push(
      find([{ l1: [{ tags: ["tag1", "tag2"] }, { notags: "yep" }] }], {
        "l1.tags": { $regex: "tag", $options: "i" }
      }).all()
    );

    it("can $regex match nested values", () => {
      expect(res.every(x => x.length === 1)).toEqual(true);
    });
  });

  describe("$jsonSchema", () => {
    const docs = [
      {
        item: "journal",
        qty: 25,
        size: { h: 14, w: 21, uom: "cm" },
        instock: true
      },
      {
        item: "notebook",
        qty: 50,
        size: { h: 8.5, w: 11, uom: "in" },
        instock: true
      },
      {
        item: "paper",
        qty: 100,
        size: { h: 8.5, w: 11, uom: "in" },
        instock: 1
      },
      {
        item: "planner",
        qty: 75,
        size: { h: 22.85, w: 30, uom: "cm" },
        instock: 1
      },
      {
        item: "postcard",
        qty: 45,
        size: { h: 10, w: 15.25, uom: "cm" },
        instock: true
      },
      { item: "apple", qty: 45, status: "A", instock: true },
      { item: "pears", qty: 50, status: "A", instock: true }
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
            w: { type: "number" }
          }
        },
        instock: { type: "boolean" }
      }
    };

    const jsonSchemaValidator: JsonSchemaValidator = (s: RawObject) => {
      const ajv = new Ajv();
      const v = ajv.compile(s as Schema);
      return (o: RawObject) => (v(o) ? true : false);
    };

    const options = { jsonSchemaValidator };

    it("matches with $jsonSchema in query", () => {
      const result = find(docs, { $jsonSchema: schema }, {}, options).all();
      expect(result.length).toEqual(5);
    });

    it("matches with $jsonSchema in aggregation", () => {
      const result = aggregate(
        docs,
        [{ $match: { $jsonSchema: schema } }],
        options
      );
      expect(result.length).toEqual(5);
    });

    it("throws error on invalid JsonSchemaValidator", () => {
      expect(() => find(docs, { $jsonSchema: schema }, {})).toThrow(
        /Missing option 'jsonSchemaValidator'/
      );
    });
  });
});
