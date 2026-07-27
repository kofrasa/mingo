import { runTest, testPath } from "../../../support";

runTest(testPath(import.meta.url), {
  $first: [
    [[1, 2, 3], 1],
    [[[]], undefined],
    [[null], null],
    [[], undefined],
    [null, null],
    [undefined, null],
    [5, Error()],
    [5, null, { failOnError: 0 }]
  ]
});
