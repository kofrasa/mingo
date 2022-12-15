import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $arrayElemAt: [
    [[[1, 2, 3], 0], 1],
    [[[1, 2, 3], -2], 2],
    [[[1, 2, 3], 15], undefined],
  ],
});
