import { describe, expect, it } from "vitest";

import { aggregate } from "../../../../src";
import { runTest, testPath } from "../../../support";

runTest("EdgeCases", {
  $firstN: [
    ["invalid", Error("expects object")],
    [{ input: null, n: 2 }, null],
    [{ input: "not array", n: 2 }, Error("resolve to array")],
    [{ input: "not array", n: 2 }, null, { failOnError: false }],
    [{ input: [1, 2, 3], n: -2 }, Error("resolve to positive integer")],
    [{ input: [1, 2, 3], n: -2 }, null, { failOnError: false }],
    [{ input: [1, 2, 3], n: 2 }, [1, 2]]
  ]
});

describe(testPath(import.meta.url), () => {
  it("passes: using $firstN as an array operator", () => {
    const res = aggregate(
      [
        { playerId: 1, score: [1, 2, 3] },
        { playerId: 2, score: [12, 90, 7, 89, 8] },
        { playerId: 3, score: [null] },
        { playerId: 4, score: [] },
        { playerId: 5, score: [1293, null, 3489, 9] },
        { playerId: 6, score: ["12.1", 2, 2090845886852, 23] }
      ],
      [{ $addFields: { firstScores: { $firstN: { n: 3, input: "$score" } } } }]
    );
    expect(res).toEqual([
      {
        playerId: 1,
        score: [1, 2, 3],
        firstScores: [1, 2, 3]
      },
      {
        playerId: 2,
        score: [12, 90, 7, 89, 8],
        firstScores: [12, 90, 7]
      },
      {
        playerId: 3,
        score: [null],
        firstScores: [null]
      },
      {
        playerId: 4,
        score: [],
        firstScores: []
      },
      {
        playerId: 5,
        score: [1293, null, 3489, 9],
        firstScores: [1293, null, 3489]
      },
      {
        playerId: 6,
        score: ["12.1", 2, 2090845886852, 23],
        firstScores: ["12.1", 2, 2090845886852]
      }
    ]);
  });
});
