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
samples.runTestPipeline("operators/accumulator/topN", [
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
          playerId: {
            $topN: {
              output: ["$playerId", "$score"],
              sortBy: { score: 1 },
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
          ["PlayerD", undefined],
          ["PlayerE", null],
          ["PlayerA", 1],
        ],
      },
    ],
  },
  {
    message: "Data Type Sort Ordering",
    input: [
      { playerId: "PlayerA", gameId: "G1", score: 1 },
      { playerId: "PlayerB", gameId: "G1", score: "2" },
      { playerId: "PlayerC", gameId: "G1", score: "" },
    ],
    pipeline: [
      {
        $group: {
          _id: "$gameId",
          playerId: {
            $topN: {
              output: ["$playerId", "$score"],
              sortBy: { score: -1 },
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
          ["PlayerB", "2"],
          ["PlayerC", ""],
          ["PlayerA", 1],
        ],
      },
    ],
  },

  {
    message: "Finding the Three Highest Score Documents Across Multiple Games",
    input: docs,
    pipeline: [
      {
        $match: { gameId: "G1" },
      },
      {
        $group: {
          _id: "$gameId",
          playerId: {
            $topN: {
              output: ["$playerId", "$score"],
              sortBy: { score: -1 },
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
          ["PlayerC", 99],
          ["PlayerB", 33],
          ["PlayerA", 31],
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
            $topN: {
              output: "$score",
              n: {
                $cond: { if: { $eq: ["$gameId", "G2"] }, then: 1, else: 3 },
              },
              sortBy: { score: -1 },
            },
          },
        },
      },
    ],
    expected: [
      { _id: { gameId: "G1" }, gamescores: [99, 33, 31] },
      { _id: { gameId: "G2" }, gamescores: [80] },
    ],
  },
]);
