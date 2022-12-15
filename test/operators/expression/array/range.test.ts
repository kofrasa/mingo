import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $range: [
    [
      [0, 10, 2],
      [0, 2, 4, 6, 8],
    ],
    [
      [10, 0, -2],
      [10, 8, 6, 4, 2],
    ],
    [[0, 10, -2], []],
    [
      [0, 5],
      [0, 1, 2, 3, 4],
    ],
  ],
});
