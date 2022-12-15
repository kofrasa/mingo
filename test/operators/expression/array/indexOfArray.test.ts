import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $indexOfArray: [
    [null, null],
    [[["a", "abc"], "a"], 0],
    [[["a", "abc", "de", ["de"]], ["de"]], 3],
    [[[1, 2], 5], -1],
    [
      [
        [1, 2, 3],
        [1, 2],
      ],
      -1,
    ],
    [[[10, 9, 9, 8, 9], 9, 3], 4],
    [[["a", "abc", "b"], "b", 0, 1], -1],
    [[["a", "abc", "b"], "b", 1, 0], -1],
    [[["a", "abc", "b"], "b", 20], -1],
    [[[null, null, null], null], 0],
    [[null, "foo"], null],
    [
      ["foo", "foo"],
      "$indexOfArray expression must resolve to an array.",
      { err: true },
    ],
  ],
});
