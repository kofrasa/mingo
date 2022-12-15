import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $reduce: [
    [{ input: null }, null],
    [
      {
        input: ["a", "b", "c"],
        initialValue: "",
        in: { $concat: ["$$value", "$$this"] },
      },
      "abc",
    ],
    [
      {
        input: [1, 2, 3, 4],
        initialValue: { sum: 5, product: 2 },
        in: {
          sum: { $add: ["$$value.sum", "$$this"] },
          product: { $multiply: ["$$value.product", "$$this"] },
        },
      },
      { sum: 15, product: 48 },
    ],
    [
      {
        input: [
          [3, 4],
          [5, 6],
        ],
        initialValue: [1, 2],
        in: { $concatArrays: ["$$value", "$$this"] },
      },
      [1, 2, 3, 4, 5, 6],
    ],
  ],
});
