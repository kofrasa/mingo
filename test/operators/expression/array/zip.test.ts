import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $zip: [
    [{ inputs: [["a"], null] }, null],
    [{ inputs: [["a"], ["b"], ["c"]] }, [["a", "b", "c"]]],
    [{ inputs: [["a"], ["b", "c"]] }, [["a", "b"]]],
    [
      {
        inputs: [[1], [2, 3]],
        useLongestLength: true,
      },
      [
        [1, 2],
        [null, 3],
      ],
    ],
    // Because useLongestLength: true, $zip will pad the shorter input arrays with the corresponding defaults elements.
    [
      {
        inputs: [[1], [2, 3], [4]],
        useLongestLength: true,
        defaults: ["a", "b", "c"],
      },
      [
        [1, 2, 4],
        ["a", 3, "c"],
      ],
    ],
  ],
});
