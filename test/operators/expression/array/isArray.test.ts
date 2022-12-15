import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $isArray: [
    [["hello"], false],
    [[["hello", "world"]], true],
  ],
});
