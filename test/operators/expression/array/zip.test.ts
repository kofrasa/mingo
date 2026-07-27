import { runTest, testPath } from "../../../support";

runTest(testPath(import.meta.url), {
  $zip: [
    [null, Error("invalid arguments")],
    [null, Error("invalid arguments"), { failOnError: false }],
    [{ inputs: null }, null],
    [{ inputs: "not an array" }, Error("must resolve to array")],
    [{ inputs: "not an array" }, null, { failOnError: false }],
    [{ inputs: [], useLongestLength: "invalid" }, Error("must be boolean")],
    [
      {
        inputs: [
          [1, 2],
          ["a", "b"]
        ],
        defaults: ["x", "y"]
      },
      Error("'useLongestLength' must be set to true to use 'defaults'")
    ],
    [
      {
        inputs: [[1, 2], "not an array"]
      },
      Error("must resolve to array")
    ],
    // happy cases
    [{ inputs: [["a"], null] }, null],
    [{ inputs: [["a"], ["b"], ["c"]] }, [["a", "b", "c"]]],
    [{ inputs: [["a"], ["b", "c"]] }, [["a", "b"]]],
    [
      {
        inputs: [[1], [2, 3]],
        useLongestLength: true
      },
      [
        [1, 2],
        [null, 3]
      ]
    ],
    // Because useLongestLength: true, $zip will pad the shorter input arrays with the corresponding defaults elements.
    [
      {
        inputs: [[1], [2, 3], [4]],
        useLongestLength: true,
        defaults: ["a", "b", "c"]
      },
      [
        [1, 2, 4],
        ["a", 3, "c"]
      ]
    ],
    // must specify default for each input
    [
      {
        inputs: [[1], [2, 3], [4]],
        useLongestLength: true,
        defaults: ["a", "b"]
      },
      Error()
    ],
    // default to null when 'defaults' nil or empty
    [
      {
        inputs: [[1], [2, 3], [4]],
        useLongestLength: true,
        defaults: []
      },
      [
        [1, 2, 4],
        [null, 3, null]
      ]
    ]
  ]
});
