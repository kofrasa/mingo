import * as support from "../../../support";

support.runTest(support.testPath(import.meta.url), {
  $reverseArray: [
    [null, null],
    ["abc", Error("resolve to array")],
    [
      [1, 2, 3],
      [3, 2, 1]
    ],
    [
      { $reverseArray: { $slice: [["foo", "bar", "baz", "qux"], 1, 2] } },
      ["baz", "bar"]
    ],
    [null, null],
    [[], []],
    [
      [
        [1, 2, 3],
        [4, 5, 6]
      ],
      [
        [4, 5, 6],
        [1, 2, 3]
      ]
    ]
  ]
});
