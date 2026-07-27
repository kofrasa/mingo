import { runTest, testPath } from "../../../support";

runTest(testPath(import.meta.url), {
  $slice: [
    [null, Error("expects array(3)")],
    [[null, 2], Error("arg1 <array>")],
    [[[], "0"], Error("arg2 <n>")],
    [[[], 0, "1"], Error("arg3 <n>")],
    [[[], 0, -1], Error("arg3 <n>")],
    [[[], -2, -1], Error("arg3 <n>.+ positive")],
    // failOnError: false
    [[null, 2], null, { failOnError: false }],
    [[[], "nan"], null, { failOnError: false }],
    [[[], 0, -1], null, { failOnError: false }],
    // happy cases
    [[[1, 2, 3], -1], [3]],
    [[[1, 2, 3], 1, 1], [2]],
    [
      [[1, 2, 3], 2],
      [1, 2]
    ],
    [[[1, 2, 3], 1, 1], [2]],
    [
      [[1, 2, 3], -2],
      [2, 3]
    ],
    [[[1, 2, 3], 15, 2], []],
    [
      [[1, 2, 3], -15, 2],
      [1, 2]
    ],
    [
      [[1, 2, 3, 4, 5, 6], -2],
      [5, 6]
    ],
    [[[1, 2, 3, 4, 5, 6], -2, 1], [5]],
    [
      [[1, 2, 3, 4, 5, 6], -8, 2],
      [1, 2]
    ]
  ]
});
