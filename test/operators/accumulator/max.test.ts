import { runTest, testPath } from "../../support";

runTest(testPath(import.meta.url), {
  $max: [
    [[], null],
    [[3, null, 2, 1], 3],
    [["as", 0], "as"],
    [[1, "as"], "as"]
  ]
});
