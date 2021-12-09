import * as samples from "../../support";

samples.runTestPipeline("operators/pipeline/count", [
  {
    message: "can $count pipeline results",
    input: [
      { _id: 1, subject: "History", score: 88 },
      { _id: 2, subject: "History", score: 92 },
      { _id: 3, subject: "History", score: 97 },
      { _id: 4, subject: "History", score: 71 },
      { _id: 5, subject: "History", score: 79 },
      { _id: 6, subject: "History", score: 83 },
    ],
    pipeline: [
      {
        $match: {
          score: {
            $gt: 80,
          },
        },
      },
      {
        $count: "passing_scores",
      },
    ],
    expected: [{ passing_scores: 4 }],
  },
]);
