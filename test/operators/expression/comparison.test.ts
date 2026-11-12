import { describe, expect, it } from "vitest";

import { aggregate, Query } from "../../../src";
import { AnyObject } from "../../../src/types";
import { runTest, testPath } from "../../support";

// MongoDB compares both value and type, using the BSON comparison order for
// values of different types, and compares arrays as whole values.
runTest("operators/expression/comparison", {
  $cmp: [
    [["b", 2], 1],
    [[null, 0], -1],
    [[[1], 1], 1],
    [
      [
        [1, 2],
        [2, 1]
      ],
      -1
    ],
    [
      [
        [2, 1],
        [1, 3]
      ],
      1
    ],
    [[true, 2], 1],
    [[{ a: 1 }, { b: 1 }], -1],
    [[{ a: 1 }, { a: 1, b: 2 }], -1],
    [[{ a: 2 }, { a: 1, b: 1 }], 1],
    [[{ a: "x" }, { a: 5 }], 1],
    [
      [
        { a: 1, b: 2 },
        { a: 1, b: 2 }
      ],
      0
    ]
  ],
  $eq: [
    [[1, 1], true],
    [["1", 1], false],
    [[[1], 1], false],
    [
      [
        [1, 2],
        [1, 2]
      ],
      true
    ],
    [
      [
        [1, 2],
        [2, 1]
      ],
      false
    ],
    [[{ a: [1, 2] }, { a: [2, 1] }], false],
    [
      [
        { a: 1, b: 2 },
        { b: 2, a: 1 }
      ],
      true
    ],
    [[NaN, NaN], true],
    [[NaN, 1], false],
    [[null, null], true]
  ],
  $ne: [
    [[[1], 1], true],
    [[1, 1], false],
    [[NaN, 0], true]
  ],
  $gt: [
    [["b", 2], true],
    [[true, 1], true],
    [[[1], 100], true],
    [
      [
        [2, 1],
        [1, 3]
      ],
      true
    ],
    [[0, NaN], true],
    [[2, 1], true],
    [[1, 2], false]
  ],
  $gte: [
    [[[1], [1]], true],
    [[null, 0], false]
  ],
  $lt: [
    [[null, 0], true],
    [[NaN, -Infinity], true],
    [[1, "a"], true],
    [[2, 1], false]
  ],
  $lte: [
    [[{ a: 1 }, [0]], true],
    [["a", 1], false]
  ]
});

describe(testPath(import.meta.url), () => {
  it("compares field values with BSON type order (#643)", () => {
    const res = aggregate(
      [{ a: [1] }],
      [
        {
          $project: {
            _id: 0,
            strGtNum: { $gt: ["b", 2] },
            nullLtNum: { $lt: [null, 0] },
            missingLtNull: { $lt: ["$missing", null] },
            missingEqNull: { $eq: ["$missing", null] },
            arrEqElem: { $eq: ["$a", 1] },
            arrGteSelf: { $gte: ["$a", "$a"] },
            cmpStrNum: { $cmp: ["b", 2] }
          }
        }
      ]
    );
    expect(res).toEqual([
      {
        strGtNum: true,
        nullLtNum: true,
        missingLtNull: true,
        missingEqNull: false,
        arrEqElem: false,
        arrGteSelf: true,
        cmpStrNum: 1
      }
    ]);
  });

  it("orders values of other types in $expr", () => {
    const docs: AnyObject[] = [{ b: "A" }, { b: 2 }, { b: true }, {}, { b: 0 }];
    const res = new Query({ $expr: { $gt: ["$b", 1] } }).find(docs).all();
    expect(res).toEqual([{ b: "A" }, { b: 2 }, { b: true }]);
  });

  it("resolves fields in the n argument of $group accumulators against the group key", () => {
    const docs = [
      { g: "G1", s: 1 },
      { g: "G1", s: 2 },
      { g: "G2", s: 3 },
      { g: "G2", s: 4 }
    ];
    const res = aggregate(docs, [
      {
        $group: {
          _id: { g: "$g" },
          first: {
            $firstN: {
              input: "$s",
              n: { $cond: { if: { $eq: ["$g", "G2"] }, then: 1, else: 2 } }
            }
          }
        }
      },
      { $sort: { "_id.g": 1 } }
    ]);
    expect(res).toEqual([
      { _id: { g: "G1" }, first: [1, 2] },
      { _id: { g: "G2" }, first: [3] }
    ]);
  });
});
