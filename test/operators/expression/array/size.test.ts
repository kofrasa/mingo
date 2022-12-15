import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $size: [
    [["a", "b", "c"], 3],
    [[10], 1],
    [[], 0],
  ],
});
