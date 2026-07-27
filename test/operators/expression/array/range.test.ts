import { runTest, testPath } from "../../../support";

runTest(testPath(import.meta.url), {
  $range: [
    [[0], Error("expects array(3)")],
    [[0], Error("expects array(3)"), { failOnError: false }],
    [["0", "1"], Error("arg1 <start>")],
    [[0, "1"], Error("arg2 <end>")],
    [[0, 1, "1"], Error("arg3 <step>")],
    [[0, "1"], null, { failOnError: false }],
    [
      [0, 10, 2],
      [0, 2, 4, 6, 8]
    ],
    [
      [10, 0, -2],
      [10, 8, 6, 4, 2]
    ],
    [[0, 10, -2], []],
    [
      [0, 5],
      [0, 1, 2, 3, 4]
    ]
  ]
});
