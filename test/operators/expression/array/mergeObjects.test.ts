import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $mergeObjects: [
    [[{ a: 1 }, null], { a: 1 }],
    [[null, null], {}],
    [[{ a: 1 }, { a: 2, b: 2 }, { a: 3, c: 3 }], { a: 3, b: 2, c: 3 }],
    [
      [{ a: 1 }, { a: 2, b: 2 }, { a: 3, b: null, c: 3 }],
      { a: 3, b: null, c: 3 },
    ],
  ],
});
