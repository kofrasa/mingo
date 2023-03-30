import * as support from "../../support";

// default: useStrictMode=true
support.runTest("operators/expression/conditional", {
  $cond: [
    [{ if: { $lte: [200, 200] }, then: "low", else: "high" }, "low"],
    [{ if: { $lte: [500, 200] }, then: "low", else: "high" }, "high"],
    [[{ $lte: [100, 200] }, "low", "high"], "low"],
    [[{ $lte: [500, 200] }, "low", "high"], "high"],
    [["", "yes", "no"], "yes"],
  ],
  $switch: [
    [
      {
        branches: [
          { case: { $lte: [500, 200] }, then: "low" },
          { case: { $gte: [500, 400] }, then: "high" },
        ],
        default: "normal",
      },
      "high",
    ],
    [
      {
        branches: [
          { case: { $lte: [100, 200] }, then: "low" },
          { case: { $gte: [100, 400] }, then: "high" },
        ],
        default: "normal",
      },
      "low",
    ],
    [
      {
        branches: [
          { case: { $lt: [500, 200] }, then: "low" },
          { case: { $gt: [200, 400] }, then: "high" },
        ],
        default: "normal",
      },
      "normal",
    ],
    [
      {
        branches: [{ case: "", then: "yes" }],
        default: "no",
      },
      "yes",
    ],
  ],
  $ifNull: [
    [[null, "Unspecified"], "Unspecified"],
    [[undefined, "Unspecified"], "Unspecified"],
    [[5, "Unspecified"], 5],
    [[5, "Unspecified", "Dummy"], 5],
    [[null, null, "Unspecified"], "Unspecified"],
    [[null, "", "Unspecified"], ""],
  ],
});
