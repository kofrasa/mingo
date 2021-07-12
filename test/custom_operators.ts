import test from "tape";

import { aggregate, Aggregator, find } from "../src";
import {
  addOperators,
  AddOperatorsMap,
  OperatorContext,
  OperatorType,
} from "../src/core";
import { AnyVal, Collection, RawObject } from "../src/types";
import * as support from "./support";

test("Custom Operators", (t) => {
  t.test("custom pipeline operator", (t) => {
    t.plan(1);

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
    t.ok(typeof result[0] === "number", "can add new pipeline operator");
  });

  function $between(selector: string, lhs: AnyVal, rhs: AnyVal): boolean {
    const args = rhs as number[];
    const value = lhs as number;
    return value >= args[0] && value <= args[1];
  }

  t.test("custom query operator", (t) => {
    t.plan(2);

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
    t.equal(2, result.length, "can add new query operator");

    try {
      addOperators(OperatorType.QUERY, (_: OperatorContext) => {
        return { $between };
      });
    } catch (e) {
      t.ok(true, "cannot override existing operators");
    }
  });

  t.test("custom accumulator operator", (t) => {
    t.plan(2);
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
    t.ok(result.length === 1, "must return one result after grouping");
    t.equal(
      28.57362029450366,
      (result[0] as RawObject).stddev,
      "must return correct stddev"
    );
  });
});
