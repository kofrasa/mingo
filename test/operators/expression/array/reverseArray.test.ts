import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $reverseArray: [
    [
      [1, 2, 3],
      [3, 2, 1],
    ],
    [
      { $reverseArray: { $slice: [["foo", "bar", "baz", "qux"], 1, 2] } },
      ["baz", "bar"],
    ],
    [null, null],
    [[], []],
    [
      [
        [1, 2, 3],
        [4, 5, 6],
      ],
      [
        [4, 5, 6],
        [1, 2, 3],
      ],
    ],
  ],
});
