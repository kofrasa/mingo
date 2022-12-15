import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $filter: [
    [
      {
        input: [1, "a", 2, null, 3.1, 4, "5"],
        as: "num",
        cond: {
          $and: [
            { $gte: ["$$num", Number.MIN_SAFE_INTEGER] },
            { $lte: ["$$num", Number.MAX_SAFE_INTEGER] },
          ],
        },
      },
      [1, 2, 3.1, 4],
    ],
  ],
});
