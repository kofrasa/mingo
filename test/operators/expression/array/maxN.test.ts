import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $maxN: [
    [
      {
        input: [12, 90, 7, 89, 8],
        n: 2,
      },
      [90, 89],
    ],
    [
      {
        input: [null],
        n: 2,
      },
      [],
    ],
    [
      {
        input: [],
        n: 2,
      },
      [],
    ],
    [
      {
        input: [1293, "2", 3489, 9],
        n: 2,
      },
      ["2", 3489],
    ],
  ],
});
