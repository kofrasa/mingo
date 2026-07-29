import { describe, expect, it } from "vitest";

import { Query } from "../../../src";
import { Any, AnyObject } from "../../../src/types";
import { testPath } from "../../support";

/**
 * MongoDB parity tests: every expectation in this file encodes the behavior
 * of a real mongod (verified against MongoDB 7.x via mongodb-memory-server).
 *
 * The "divergences" sections currently FAIL on mingo and document known
 * differences from MongoDB:
 * 1. a regex list member of $in must pattern-match string values
 *    (https://www.mongodb.com/docs/manual/reference/operator/query/in/),
 *    and $nin is the exact negation of $in
 * 2. {$elemMatch: {}} matches arrays that contain at least one
 *    document (object) element
 *
 * The "regression guards" section already agrees with MongoDB and must
 * keep passing after any fix.
 */

const test = (criteria: AnyObject, obj: Any): boolean =>
  new Query(criteria).test(obj as AnyObject);

describe(testPath(__filename), () => {
  describe("divergence: regex values inside $in pattern-match strings", () => {
    it("matches a string against a regex list member", () => {
      // mongod: true
      expect(test({ f: { $in: [/^ab/] } }, { f: "abc" })).toBe(true);
    });

    it("matches a string against a regex member of a mixed list", () => {
      // mongod: true
      expect(test({ f: { $in: [/^a/, 5] } }, { f: "aX" })).toBe(true);
    });

    it("matches a string element of an array field against a regex member", () => {
      // mongod: true
      expect(test({ f: { $in: [/^ab/] } }, { f: ["xyz", "abc"] })).toBe(true);
    });

    it("still matches an equal stored regex value", () => {
      // mongod: true (a regex in $in also matches equal regex values)
      expect(test({ f: { $in: [/^ab/] } }, { f: /^ab/ })).toBe(true);
    });

    it("does not match a string that fails the pattern", () => {
      // mongod: false
      expect(test({ f: { $in: [/^ab/] } }, { f: "xbc" })).toBe(false);
    });

    it("does not match a non-string value against a regex member", () => {
      // mongod: false (regex members only pattern-match strings)
      expect(test({ f: { $in: [/^4/] } }, { f: 42 })).toBe(false);
    });
  });

  describe("divergence: $nin is the exact negation of $in", () => {
    it("excludes a string that pattern-matches a regex list member", () => {
      // mongod: false ('abc' IS in [/^ab/], so $nin must reject it)
      expect(test({ f: { $nin: [/^ab/] } }, { f: "abc" })).toBe(false);
    });

    it("keeps a string that matches no list member", () => {
      // mongod: true
      expect(test({ f: { $nin: [/^ab/] } }, { f: "xbc" })).toBe(true);
    });
  });

  describe("divergence: empty $elemMatch matches arrays containing a document", () => {
    it("matches an array with at least one object element", () => {
      // mongod: true
      expect(test({ f: { $elemMatch: {} } }, { f: [{ x: 1 }] })).toBe(true);
    });

    it("matches a mixed array via its object element", () => {
      // mongod: true
      expect(test({ f: { $elemMatch: {} } }, { f: [1, { x: 1 }] })).toBe(true);
    });

    it("does not match a scalar-only array", () => {
      // mongod: false
      expect(test({ f: { $elemMatch: {} } }, { f: [1, "a"] })).toBe(false);
    });

    it("does not match an empty array", () => {
      // mongod: false
      expect(test({ f: { $elemMatch: {} } }, { f: [] })).toBe(false);
    });

    it("does not match a non-array value", () => {
      // mongod: false
      expect(test({ f: { $elemMatch: {} } }, { f: { x: 1 } })).toBe(false);
    });
  });

  describe("regression guards: behavior that already matches MongoDB", () => {
    it("$eq with a regex operand compares literally, never as a pattern", () => {
      // mongod: false ($eq only matches literal regex values)
      expect(test({ f: { $eq: /^a/ } }, { f: "abc" })).toBe(false);
      // mongod: true (equal regex value)
      expect(test({ f: { $eq: /^a/ } }, { f: /^a/ })).toBe(true);
    });

    it("shorthand regex criteria pattern-match strings", () => {
      // mongod: true ({f: /re/} is a pattern match, unlike {f: {$eq: /re/}})
      expect(test({ f: /^ab/ }, { f: "abc" })).toBe(true);
    });

    it("comparison operators match array fields per element", () => {
      // mongod: true (20 satisfies $gt, 3 satisfies $lt)
      expect(test({ f: { $gt: 10, $lt: 5 } }, { f: [3, 20] })).toBe(true);
    });

    it("comparison operators respect type bracketing", () => {
      // mongod: false (a string bound never matches a number)
      expect(test({ f: { $gte: "pre" } }, { f: 42 })).toBe(false);
    });

    it("missing fields match $ne and $eq: null", () => {
      // mongod: true in both cases
      expect(test({ g: { $ne: 1 } }, { f: 1 })).toBe(true);
      expect(test({ g: { $eq: null } }, { f: 1 })).toBe(true);
    });
  });
});
