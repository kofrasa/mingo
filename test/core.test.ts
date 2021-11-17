import { aggregate, Aggregator, find } from "../src";
import {
  addOperators,
  AddOperatorsMap,
  OperatorContext,
  OperatorType,
} from "../src/core";
import { AnyVal, Collection, RawObject } from "../src/types";
import { isNumber } from "../src/util";
import * as support from "./support";

describe("Custom Operators", () => {
  it("should add new pipeline operator", () => {
    function $pluck(collection: unknown, expr: AnyVal): unknown {
      const array = collection as Array<{ __temp__: unknown }>;
      const agg = new Aggregator([{ $project: { __temp__: expr } }]);
      return agg.stream(array).map((item) => item["__temp__"]);
    }

    addOperators(OperatorType.PIPELINE, (_): AddOperatorsMap => {
      return { $pluck };
    });

    const result = aggregate(support.complexGradesData, [
      { $unwind: "$scores" },
      { $pluck: "$scores.score" },
    ]);

    expect(isNumber(result[0])).toBe(true);
  });

  it("should add new query operator", () => {
    function $between(selector: string, lhs: AnyVal, rhs: AnyVal): boolean {
      const args = rhs as number[];
      const value = lhs as number;
      return value >= args[0] && value <= args[1];
    }

    addOperators(OperatorType.QUERY, (_): AddOperatorsMap => {
      return { $between };
    });

    const coll = [
      { a: 1, b: 1 },
      { a: 7, b: 1 },
      { a: 10, b: 6 },
      { a: 20, b: 10 },
    ];
    const result = find(coll, { a: { $between: [5, 10] } }, null).all();
    expect(result.length).toBe(2);
    expect(() =>
      addOperators(OperatorType.QUERY, (_: OperatorContext) => {
        return { $between };
      })
    ).toThrow(/\$between already exists/);
  });

  it("should add accumulator operator", () => {
    addOperators(OperatorType.ACCUMULATOR, (m) => {
      return {
        $stddev: (collection: Collection, expr: AnyVal) => {
          const result = aggregate(collection, [
            { $group: { avg: { $avg: expr } } },
          ]) as Array<RawObject>;
          const avg = result[0].avg as number;
          const diffs = collection.map((item) => {
            const v = (m.computeValue(item, expr, null) as number) - avg;
            return v * v;
          });
          const variance =
            diffs.reduce((memo, val) => {
              return memo + val;
            }, 0) / diffs.length;
          return Math.sqrt(variance);
        },
      };
    });

    const result = aggregate(support.complexGradesData, [
      { $unwind: "$scores" },
      { $group: { stddev: { $stddev: "$scores.score" } } },
    ]);
    expect(result.length).toBe(1);
    expect((result[0] as RawObject).stddev).toEqual(28.57362029450366);
  });
});
