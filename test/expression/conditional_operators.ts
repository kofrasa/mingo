import * as support from "../support";

support.runTest("Conditional Operators", {
  $cond: [
    [{ if: { $lte: [200, 200] }, then: "low", else: "high" }, "low"],
    [{ if: { $lte: [500, 200] }, then: "low", else: "high" }, "high"],
    [[{ $lte: [100, 200] }, "low", "high"], "low"],
    [[{ $lte: [500, 200] }, "low", "high"], "high"],
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
  ],
  $ifNull: [
    [[null, "Unspecified"], "Unspecified"],
    [[undefined, "Unspecified"], "Unspecified"],
    [[5, "Unspecified"], 5],
    [[5, "Unspecified", "error"], "invalid arguments", { err: true }],
  ],
});
