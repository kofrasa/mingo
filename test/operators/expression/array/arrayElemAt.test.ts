import * as support from "../../../support";

support.runTest(support.testPath(import.meta.url), {
  $arrayElemAt: [
    [[], Error("expects array(2)")],
    [["not array", "nan"], Error("<array>")],
    [[[], "2"], Error("<index>")],
    [[[], "2"], null, { failOnError: false }],
    [[[], null], null],
    [[[1, 2, 3], 0], 1],
    [[[1, 2, 3], -2], 2],
    [[[1, 2, 3], 15], undefined]
  ]
});
