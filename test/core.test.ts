import { aggregate, Aggregator, find } from "../src";
import { computeValue, OperatorType, Options, useOperators } from "../src/core";
import { AnyVal, RawObject } from "../src/types";
import { isNumber, resolve } from "../src/util";
import * as support from "./support";

describe("core", () => {
  describe("useOperators", () => {
    it("should add new pipeline operator", () => {
      function $pluck(collection: AnyVal, expr: AnyVal): AnyVal {
        const array = collection as Array<{ __temp__: AnyVal }>;
        const agg = new Aggregator([{ $project: { __temp__: expr } }]);
        return agg.stream(array).map((item) => item["__temp__"] as AnyVal);
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
          const value = resolve(obj, selector, { unwrapArray: true });
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
      const result = find(coll, { a: { $between: [5, 10] } }, null).all();
      expect(result.length).toBe(2);
    });

    it("should add accumulator operator", () => {
      useOperators(OperatorType.ACCUMULATOR, {
        $stddev: (collection: RawObject[], expr: AnyVal) => {
          const result = aggregate(collection, [
            { $group: { avg: { $avg: expr } } },
          ]) as Array<RawObject>;
          const avg = result[0].avg as number;
          const diffs = collection.map((item) => {
            const v = (computeValue(item, expr, null) as number) - avg;
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
      expect((result[0] as RawObject).stddev).toEqual(28.57362029450366);
    });
  });
});
