import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { runTest, testPath } from "../../support";

const docs = [
  { playerId: "PlayerA", gameId: "G1", score: 31 },
  { playerId: "PlayerB", gameId: "G1", score: 33 },
  { playerId: "PlayerC", gameId: "G1", score: 99 },
  { playerId: "PlayerD", gameId: "G1", score: 1 },
  { playerId: "PlayerA", gameId: "G2", score: 10 },
  { playerId: "PlayerB", gameId: "G2", score: 14 },
  { playerId: "PlayerC", gameId: "G2", score: 66 },
  { playerId: "PlayerD", gameId: "G2", score: 80 }
];

runTest("SimpleTests", {
  $firstN: [[{ input: [1, 2, 3, 4], n: "invalid" }, Error("positive integer")]]
});

describe(testPath(import.meta.url), () => {
  it("handle Null and Missing Values", () => {
    const res = aggregate(
      [
        { playerId: "PlayerA", gameId: "G1", score: 1 },
        { playerId: "PlayerB", gameId: "G1", score: 2 },
        { playerId: "PlayerC", gameId: "G1", score: 3 },
        { playerId: "PlayerD", gameId: "G1" },
        { playerId: "PlayerE", gameId: "G1", score: null }
      ],
      [
        {
          $group: {
            _id: "$gameId",
            firstFiveScores: { $firstN: { input: "$score", n: 5 } }
          }
        }
      ]
    );
    expect(res).toEqual([
      {
        _id: "G1",
        firstFiveScores: [1, 2, 3, null, null]
      }
    ]);
  });

  it("passes: First Three Player Scores Across Multiple Games", () => {
    const res = aggregate(docs, [
      {
        $group: {
          _id: "$gameId",
          playerId: {
            $firstN: {
              input: ["$playerId", "$score"],
              n: 3
            }
          }
        }
      }
    ]);
    expect(res).toEqual([
      {
        _id: "G1",
        playerId: [
          ["PlayerA", 31],
          ["PlayerB", 33],
          ["PlayerC", 99]
        ]
      },
      {
        _id: "G2",
        playerId: [
          ["PlayerA", 10],
          ["PlayerB", 14],
          ["PlayerC", 66]
        ]
      }
    ]);
  });

  it("passes: Computing n Based on the Group Key for $group", () => {
    const res = aggregate(docs, [
      {
        $group: {
          _id: { gameId: "$gameId" },
          gamescores: {
            $firstN: {
              input: "$score",
              n: {
                $cond: { if: { $eq: ["$gameId", "G2"] }, then: 1, else: 3 }
              }
            }
          }
        }
      }
    ]);
    expect(res).toEqual([
      { _id: { gameId: "G1" }, gamescores: [31, 33, 99] },
      { _id: { gameId: "G2" }, gamescores: [10] }
    ]);
  });

  it("should handle empty input", () => {
    const res = aggregate(
      [],
      [
        {
          $group: {
            _id: "$gameId",
            firstFiveScores: {
              $firstN: {
                input: "$score",
                n: 5
              }
            }
          }
        }
      ]
    );
    expect(res).toEqual([]);
  });

  it("passes: Compute n Based on the Group Key for $group with $cond and $eq", () => {
    const res = aggregate(docs, [
      {
        $group: {
          _id: { gameId: "$gameId" },
          gamescores: {
            $firstN: {
              input: "$score",
              n: {
                $cond: { if: { $eq: ["$gameId", "G2"] }, then: 1, else: 3 }
              }
            }
          }
        }
      }
    ]);
    expect(res).toEqual([
      { _id: { gameId: "G1" }, gamescores: [31, 33, 99] },
      { _id: { gameId: "G2" }, gamescores: [10] }
    ]);
  });

  it("passes: Using $firstN as an Aggregation Expression", () => {
    const res = aggregate(
      [{ array: [10, 20, 30, 40] }],
      [
        {
          $project: {
            firstThreeElements: {
              $firstN: {
                input: "$array",
                n: 3
              }
            }
          }
        }
      ]
    );
    expect(res).toEqual([{ firstThreeElements: [10, 20, 30] }]);
  });
});
