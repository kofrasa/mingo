import test from "tape";

import { aggregate } from "../../src";

/**
 * Tests for $count pipeline operator
 */
test("$count pipeline operator", (t) => {
  const scores = [
    { _id: 1, subject: "History", score: 88 },
    { _id: 2, subject: "History", score: 92 },
    { _id: 3, subject: "History", score: 97 },
    { _id: 4, subject: "History", score: 71 },
    { _id: 5, subject: "History", score: 79 },
    { _id: 6, subject: "History", score: 83 },
  ];

  const result = aggregate(scores, [
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
  ]);

  t.deepEqual(result, { passing_scores: 4 }, "can $count pipeline results");

  t.end();
});
