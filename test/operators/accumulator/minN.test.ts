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

samples.runTestPipeline("operators/accumulator/minN", [
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
          minimumThreeScores: {
            $minN: {
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
        minimumThreeScores: [1, 2, 3],
      },
    ],
  },
  {
    message: "Finding the Minimum Three Scores Across Multiple Games",
    input: docs,
    pipeline: [
      {
        $group: {
          _id: "$gameId",
          minScores: {
            $minN: {
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
        minScores: [
          [1, "PlayerD"],
          [31, "PlayerA"],
          [33, "PlayerB"],
        ],
      },
      {
        _id: "G2",
        minScores: [
          [10, "PlayerA"],
          [14, "PlayerB"],
          [66, "PlayerC"],
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
            $minN: {
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
          [1, "PlayerD"],
          [31, "PlayerA"],
          [33, "PlayerB"],
        ],
      },
      { _id: { gameId: "G2" }, gamescores: [[10, "PlayerA"]] },
    ],
  },
]);
