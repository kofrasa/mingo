import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $arrayToObject: [
    [
      {
        $arrayToObject: {
          $literal: [
            { k: "item", v: "abc123" },
            { k: "qty", v: 25 },
          ],
        },
      },
      { item: "abc123", qty: 25 },
    ],
    [
      {
        $arrayToObject: {
          $literal: [
            ["item", "abc123"],
            ["qty", 25],
          ],
        },
      },
      { item: "abc123", qty: 25 },
    ],
  ],
});
