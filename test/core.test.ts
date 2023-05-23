import { aggregate, Aggregator, find } from "../src";
import {
  ComputeOptions,
  computeValue,
  OperatorType,
  Options,
  ProcessingMode,
  redact,
  useOperators
} from "../src/core";
import { AnyVal, RawArray, RawObject } from "../src/types";
import { isNumber, resolve } from "../src/util";
import * as support from "./support";

const copts = ComputeOptions.init();

describe("core", () => {
  afterEach(() => {
    copts.update();
  });

  describe("ComputeOptions", () => {
    it("should preserve 'root' on init if defined", () => {
      expect(copts.root).toBeUndefined();
      copts.update(false);
      expect(copts.root).toEqual(false);
      expect(ComputeOptions.init(copts, true).root).toEqual(false);
    });

    it("should preserve 'local' on init if defined", () => {
      expect(copts.local).toBeUndefined();
      copts.update(null, { groupId: 5 });
      expect(copts.local?.groupId).toEqual(5);
      expect(ComputeOptions.init(copts).local?.groupId).toEqual(5);
    });

    it("should access all members of init options", () => {
      copts.update(true, { variables: { x: 10 } });
      expect(copts.idKey).toEqual("_id");
      expect(copts.scriptEnabled).toEqual(true);
      expect(copts.useStrictMode).toEqual(true);
      expect(copts.processingMode).toEqual(ProcessingMode.CLONE_OFF);
      expect(copts.collation).toBeUndefined();
      expect(copts.collectionResolver).toBeUndefined();
      expect(copts.hashFunction).toBeUndefined();
      expect(copts.jsonSchemaValidator).toBeUndefined();
      expect(copts.variables).toBeUndefined();
      expect(copts.local?.variables).toEqual({ x: 10 });
      expect(copts.root).toEqual(true);
    });

    it("should merge new variables on update when non-empty", () => {
      copts.update(true, { variables: { x: 10 } });
      copts.update(true, { variables: { y: 20 } });
      expect(copts.local?.variables).toEqual({ x: 10, y: 20 });

      copts.update(true);
      expect(copts.local?.variables).toBeUndefined();
    });
  });
  describe("useOperators", () => {
    it("should add new pipeline operator", () => {
      function $pluck(collection: AnyVal, expr: AnyVal): AnyVal {
        const array = collection as Array<{ __temp__: AnyVal }>;
        const agg = new Aggregator([{ $project: { __temp__: expr } }]);
        return agg.stream(array).map(item => (item as RawObject)["__temp__"]);
      }

      useOperators(OperatorType.PIPELINE, { $pluck });

      const result = aggregate(support.complexGradesData, [
        { $unwind: "$scores" },
        { $pluck: "$scores.score" }
      ]);

      expect(isNumber(result[0])).toBe(true);
    });

    it("should add new query operator", () => {
      function $between(selector: string, rhs: AnyVal, options?: Options) {
        const args = rhs as number[];
        // const value = lhs as number;
        return (obj: RawObject): boolean => {
          const value = resolve(obj, selector, { unwrapArray: true }) as number;
          return value >= args[0] && value <= args[1];
        };
      }

      useOperators(OperatorType.QUERY, { $between });

      const coll = [
        { a: 1, b: 1 },
        { a: 7, b: 1 },
        { a: 10, b: 6 },
        { a: 20, b: 10 }
      ];
      const result = find(coll, { a: { $between: [5, 10] } }).all();
      expect(result.length).toBe(2);
    });

    it("should add accumulator operator", () => {
      useOperators(OperatorType.ACCUMULATOR, {
        $stddev: (collection: RawArray, expr: AnyVal, options?: Options) => {
          const result = aggregate(
            collection,
            [{ $group: { _id: null, avg: { $avg: expr } } }],
            options
          );
          const avg = result[0].avg as number;
          const diffs = collection.map(item => {
            const v = (computeValue(item, expr, null) as number) - avg;
            return v * v;
          });
          const variance =
            diffs.reduce((memo, val) => {
              return memo + val;
            }, 0) / diffs.length;
          return Math.sqrt(variance);
        }
      });

      const result = aggregate(support.complexGradesData, [
        { $unwind: "$scores" },
        { $group: { _id: null, stddev: { $stddev: "$scores.score" } } }
      ]);
      expect(result.length).toBe(1);
      expect(result[0].stddev).toEqual(28.57362029450366);
    });
  });

  describe("computeValue", () => {
    it("throws for invalid operator", () => {
      expect(() => computeValue({}, {}, "$fakeOperator")).toThrow(Error);
    });

    it("computes current timestamp using $$NOW", () => {
      const result = computeValue({}, { date: "$$NOW" }, null) as {
        date: Date;
      };
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("redact", () => {
    it("returns object with $$KEEP", () => {
      const obj = { name: "Francis" };
      const result = redact(obj, "$$KEEP", copts.update(obj));
      expect(result).toStrictEqual(obj);
    });

    it("discards object with $$PRUNE", () => {
      const obj = { name: "Francis" };
      const result = redact(obj, "$$PRUNE", copts.update(obj));
      expect(result).toStrictEqual(undefined);
    });

    it("return input object for $$DESCEND if operator is not $cond", () => {
      const obj = { name: "Francis", level: "$$DESCEND" };
      const result = redact(obj, "$level", copts.update(obj));
      expect(result).toStrictEqual(obj);
    });

    it("ignore and return resolved value if not valid redact variable", () => {
      const obj = { name: "Francis" };
      const result = redact(obj, "unknown", copts.update(obj));
      expect(result).toStrictEqual("unknown");
    });
  });
});
