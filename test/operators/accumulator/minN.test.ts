import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { testPath } from "../../support";

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

describe(testPath(import.meta.url), () => {
  it("Finding the Minimum Three Scores Across Multiple Games", () => {
    const result = aggregate(docs, [
      {
        $group: {
          _id: "$gameId",
          minScores: {
            $minN: {
              input: ["$score", "$playerId"],
              n: 3
            }
          }
        }
      }
    ]);
    expect(result).toEqual([
      {
        _id: "G1",
        minScores: [
          [1, "PlayerD"],
          [31, "PlayerA"],
          [33, "PlayerB"]
        ]
      },
      {
        _id: "G2",
        minScores: [
          [10, "PlayerA"],
          [14, "PlayerB"],
          [66, "PlayerC"]
        ]
      }
    ]);
  });

  it("Null and Missing Values", () => {
    const result = aggregate(
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
            minimumThreeScores: {
              $minN: {
                input: "$score",
                n: 4
              }
            }
          }
        }
      ]
    );
    expect(result).toEqual([
      {
        _id: "G1",
        minimumThreeScores: [1, 2, 3]
      }
    ]);
  });

  it("Computing n Based on the Group Key for $group", () => {
    const result = aggregate(docs, [
      {
        $group: {
          _id: { gameId: "$gameId" },
          gamescores: {
            $minN: {
              input: ["$score", "$playerId"],
              n: {
                $cond: { if: { $eq: ["$gameId", "G2"] }, then: 1, else: 3 }
              }
            }
          }
        }
      }
    ]);
    expect(result).toEqual([
      {
        _id: { gameId: "G1" },
        gamescores: [
          [1, "PlayerD"],
          [31, "PlayerA"],
          [33, "PlayerB"]
        ]
      },
      { _id: { gameId: "G2" }, gamescores: [[10, "PlayerA"]] }
    ]);
  });
});
