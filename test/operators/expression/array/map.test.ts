import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $map: [
    [
      {
        input: [5, 6, 7],
        as: "grade",
        in: { $add: ["$$grade", 2] },
      },
      [7, 8, 9],
    ],
    [
      {
        input: [],
        as: "grade",
        in: { $add: ["$$grade", 2] },
      },
      [],
    ],
    [
      {
        input: [3, 8, 9],
        in: { $add: ["$$this", 2] },
      },
      [5, 10, 11],
    ],
  ],
});
