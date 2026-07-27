import { runTest, testPath } from "../../../support";

runTest(testPath(import.meta.url), {
  $in: [
    [[null, "invalid"], Error("arg2 <array>")],
    [[2, [1, 2, 3]], true],
    [["abc", ["xyz", "abc"]], true],
    [["xy", ["xyz", "abc"]], false],
    [[["a"], ["a"]], false],
    [[["a"], [["a"]]], true],
    [[/^a/, ["a"]], false],
    [[/^a/, [/^a/]], true]
  ]
});
