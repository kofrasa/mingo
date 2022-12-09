import { aggregate, Aggregator, find } from "../src";
import {
  ComputeOptions,
  computeValue,
  OperatorType,
  Options,
  redact,
  useOperators,
} from "../src/core";
import { AnyVal, RawArray, RawObject } from "../src/types";
import { isNumber, resolve } from "../src/util";
import * as support from "./support";

const copts = ComputeOptions.init();

describe("core", () => {
  describe("useOperators", () => {
    it("should add new pipeline operator", () => {
      function $pluck(collection: AnyVal, expr: AnyVal): AnyVal {
        const array = collection as Array<{ __temp__: AnyVal }>;
        const agg = new Aggregator([{ $project: { __temp__: expr } }]);
        return agg.stream(array).map((item) => (item as RawObject)["__temp__"]);
      }

      useOperators(OperatorType.PIPELINE, { $pluck });

      const result = aggregate(support.complexGradesData, [
        { $unwind: "$scores" },
        { $pluck: "$scores.score" },
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
        { a: 20, b: 10 },
      ];
      const result = find(coll, { a: { $between: [5, 10] } }).all();
      expect(result.length).toBe(2);
    });

    it("should add accumulator operator", () => {
      useOperators(OperatorType.ACCUMULATOR, {
        $stddev: (collection: RawArray, expr: AnyVal, options?: Options) => {
          const result = aggregate(
            collection,
            [{ $group: { avg: { $avg: expr } } }],
            options
          );
          const avg = result[0].avg as number;
          const diffs = collection.map((item) => {
            const v = (computeValue(item, expr) as number) - avg;
            return v * v;
          });
          const variance =
            diffs.reduce((memo, val) => {
              return memo + val;
            }, 0) / diffs.length;
          return Math.sqrt(variance);
        },
      });

      const result = aggregate(support.complexGradesData, [
        { $unwind: "$scores" },
        { $group: { stddev: { $stddev: "$scores.score" } } },
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
      const result = computeValue({}, { date: "$$NOW" }) as { date: Date };
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("redact", () => {
    it("returns object with $$KEEP", () => {
      const obj = { name: "Francis" };
      const result = redact(obj, "$$KEEP", copts.udpate(obj));
      expect(result).toStrictEqual(obj);
    });

    it("discards object with $$PRUNE", () => {
      const obj = { name: "Francis" };
      const result = redact(obj, "$$PRUNE", copts.udpate(obj));
      expect(result).toStrictEqual(undefined);
    });

    it("return input object for $$DESCEND if operator is not $cond", () => {
      const obj = { name: "Francis", level: "$$DESCEND" };
      const result = redact(obj, "$level", copts.udpate(obj));
      expect(result).toStrictEqual(obj);
    });

    it("ignore and return resolved value if not valid redact variable", () => {
      const obj = { name: "Francis" };
      const result = redact(obj, "unknown", copts.udpate(obj));
      expect(result).toStrictEqual("unknown");
    });
  });
});
