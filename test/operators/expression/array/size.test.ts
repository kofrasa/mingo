import { runTest, testPath } from "../../../support";

runTest(testPath(import.meta.url), {
  $size: [
    [null, null],
    ["invalid", Error("expression must resolve to number")],
    ["invalid", null, { failOnError: false }],
    [["a", "b", "c"], 3],
    [[10], 1],
    [[], 0]
  ]
});
