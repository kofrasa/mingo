import * as samples from "../../support";

const docs = [
  { playerId: "PlayerA", gameId: "G1", score: 31 },
  { playerId: "PlayerB", gameId: "G1", score: 33 },
  { playerId: "PlayerC", gameId: "G1", score: 99 },
  { playerId: "PlayerD", gameId: "G1", score: 1 },
  { playerId: "PlayerA", gameId: "G2", score: 10 },
  { playerId: "PlayerB", gameId: "G2", score: 14 },
  { playerId: "PlayerC", gameId: "G2", score: 66 },
  { playerId: "PlayerD", gameId: "G2", score: 80 },
];

samples.runTestPipeline("operators/accumulator/maxN", [
  {
    message: "Null and Missing Values",
    input: [
      { playerId: "PlayerA", gameId: "G1", score: 1 },
      { playerId: "PlayerB", gameId: "G1", score: 2 },
      { playerId: "PlayerC", gameId: "G1", score: 3 },
      { playerId: "PlayerD", gameId: "G1" },
      { playerId: "PlayerE", gameId: "G1", score: null },
    ],
    pipeline: [
      {
        $group: {
          _id: "$gameId",
          maximumThreeScores: {
            $maxN: {
              input: "$score",
              n: 4,
            },
          },
        },
      },
    ],
    expected: [
      {
        _id: "G1",
        maximumThreeScores: [3, 2, 1],
      },
    ],
  },
  {
    message: "Finding the Maximum Three Scores Across Multiple Games",
    input: docs,
    pipeline: [
      {
        $group: {
          _id: "$gameId",
          maxScores: {
            $maxN: {
              input: ["$score", "$playerId"],
              n: 3,
            },
          },
        },
      },
    ],
    expected: [
      {
        _id: "G1",
        maxScores: [
          [99, "PlayerC"],
          [33, "PlayerB"],
          [31, "PlayerA"],
        ],
      },
      {
        _id: "G2",
        maxScores: [
          [80, "PlayerD"],
          [66, "PlayerC"],
          [14, "PlayerB"],
        ],
      },
    ],
  },
  {
    message: "Computing n Based on the Group Key for $group",
    input: docs,
    pipeline: [
      {
        $group: {
          _id: { gameId: "$gameId" },
          gamescores: {
            $maxN: {
              input: ["$score", "$playerId"],
              n: {
                $cond: { if: { $eq: ["$gameId", "G2"] }, then: 1, else: 3 },
              },
            },
          },
        },
      },
    ],
    expected: [
      {
        _id: { gameId: "G1" },
        gamescores: [
          [99, "PlayerC"],
          [33, "PlayerB"],
          [31, "PlayerA"],
        ],
      },
      { _id: { gameId: "G2" }, gamescores: [[80, "PlayerD"]] },
    ],
  },
]);
