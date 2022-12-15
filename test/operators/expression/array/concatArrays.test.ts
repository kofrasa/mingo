import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $concatArrays: [
    [[["hello", " "], null], null],
    [
      [["hello", " "], ["world"]],
      ["hello", " ", "world"],
    ],
    [
      [
        ["hello", " "],
        [["world"], "again"],
      ],
      ["hello", " ", ["world"], "again"],
    ],
    [
      [
        ["hello", " "],
        [["universe"], "again"],
        ["and", "bye"],
      ],
      ["hello", " ", ["universe"], "again", "and", "bye"],
    ],
  ],
});
