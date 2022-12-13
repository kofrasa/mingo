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
samples.runTestPipeline("operators/accumulator/top", [
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
            $top: {
              output: ["$playerId", "$score"],
              sortBy: { score: 1 },
            },
          },
        },
      },
    ],
    expected: [
      {
        _id: "G1",
        playerId: [["PlayerD", undefined]],
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
            $top: {
              output: ["$playerId", "$score"],
              sortBy: { score: -1 },
            },
          },
        },
      },
    ],
    expected: [
      {
        _id: "G1",
        playerId: [["PlayerB", "2"]],
      },
    ],
  },

  {
    message: "Find the Top Score Across Multiple Games",
    input: docs,
    pipeline: [
      {
        $group: {
          _id: "$gameId",
          playerId: {
            $top: {
              output: ["$playerId", "$score"],
              sortBy: { score: -1 },
            },
          },
        },
      },
    ],
    expected: [
      { _id: "G1", playerId: [["PlayerC", 99]] },
      { _id: "G2", playerId: [["PlayerD", 80]] },
    ],
  },
]);
