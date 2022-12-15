import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $first: [
    [[1, 2, 3], 1],
    [[[]], []],
    [[null], null],
    [[], undefined],
    [null, null],
    [undefined, null],
    [5, null, { err: true }],
  ],
});
