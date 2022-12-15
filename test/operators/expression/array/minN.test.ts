import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $minN: [
    [
      {
        input: [12, 90, 7, 89, 8],
        n: 2,
      },
      [7, 8],
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
      [9, 1293],
    ],
  ],
});
