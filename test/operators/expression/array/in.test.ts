import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $in: [
    [[2, [1, 2, 3]], true],
    [["abc", ["xyz", "abc"]], true],
    [["xy", ["xyz", "abc"]], false],
    [[["a"], ["a"]], false],
    [[["a"], [["a"]]], true],
    [[/^a/, ["a"]], false],
    [[/^a/, [/^a/]], true],
  ],
});
