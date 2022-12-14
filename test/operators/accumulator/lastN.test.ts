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

samples.runTestPipeline("operators/accumulator/lastN", [
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
          lastFiveScores: {
            $lastN: {
              input: "$score",
              n: 5,
            },
          },
        },
      },
    ],
    expected: [
      {
        _id: "G1",
        lastFiveScores: [1, 2, 3, undefined, null],
      },
    ],
  },
  {
    message: "Finding the Last Three Player Scores Across Multiple Games",
    input: docs,
    pipeline: [
      {
        $group: {
          _id: "$gameId",
          playerId: {
            $lastN: {
              input: ["$playerId", "$score"],
              n: 3,
            },
          },
        },
      },
    ],
    expected: [
      {
        _id: "G1",
        playerId: [
          ["PlayerB", 33],
          ["PlayerC", 99],
          ["PlayerD", 1],
        ],
      },
      {
        _id: "G2",
        playerId: [
          ["PlayerB", 14],
          ["PlayerC", 66],
          ["PlayerD", 80],
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
            $lastN: {
              input: "$score",
              n: {
                $cond: { if: { $eq: ["$gameId", "G2"] }, then: 1, else: 3 },
              },
            },
          },
        },
      },
    ],
    expected: [
      { _id: { gameId: "G1" }, gamescores: [33, 99, 1] },
      { _id: { gameId: "G2" }, gamescores: [80] },
    ],
  },
  {
    message: "Using $lastN as an Aggregation Expression",
    input: [{ array: [10, 20, 30, 40] }],
    pipeline: [
      {
        $project: {
          lastThreeElements: {
            $lastN: {
              input: "$array",
              n: 3,
            },
          },
        },
      },
    ],
    expected: [{ lastThreeElements: [20, 30, 40] }],
  },
]);
