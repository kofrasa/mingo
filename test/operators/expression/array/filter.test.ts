import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $filter: [
    [
      {
        input: [
          "string",
          "",
          1,
          0,
          1.5,
          NaN,
          undefined,
          null,
          true,
          false,
          [],
          {},
        ],
        as: "item",
        cond: "$$item",
      },
      ["string", "", 1, 1.5, true, [], {}],
    ],
  ],
});
