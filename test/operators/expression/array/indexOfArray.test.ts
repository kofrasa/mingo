import { runTest, testPath } from "../../../support";

runTest(testPath(import.meta.url), {
  $indexOfArray: [
    [[[1, 2], "search", "<start>", "<end>"], Error()],
    [[[1, 2], "search", "<start>", "<end>"], null, { failOnError: false }],
    [[["a", "abc"], "a"], 0],
    [[["a", "abc", "de", ["de"]], ["de"]], 3],
    [[[1, 2], 5], -1],
    [
      [
        [1, 2, 3],
        [1, 2]
      ],
      -1
    ],
    [[[10, 9, 9, 8, 9], 9, 3], 4],
    [[["a", "abc", "b"], "b", 0, 1], -1],
    [[["a", "abc", "b"], "b", 1, 0], -1],
    [[["a", "abc", "b"], "b", 20], -1],
    [[[null, null, null], null], 0],
    [[null, "foo"], null],
    [["foo", "foo"], Error()],
    [[["input"], "search", "invalid", 3], Error("<start>")],
    [[["input"], "search", 0, "invalid"], Error("<end>")]
  ]
});
