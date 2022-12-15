import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $slice: [
    [[[1, 2, 3], 1, 1], [2]],
    [
      [[1, 2, 3], -2],
      [2, 3],
    ],
    [[[1, 2, 3], 15, 2], []],
    [
      [[1, 2, 3], -15, 2],
      [1, 2],
    ],
  ],
});
