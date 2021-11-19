import "../../../src/init/system";

import { aggregate } from "../../../src";

describe("operators/expression/literal", () => {
  it("can apply $literal operator", () => {
    const result = aggregate(
      [
        { _id: 1, item: "abc123", price: "$2.50" },
        { _id: 2, item: "xyz123", price: "1" },
        { _id: 3, item: "ijk123", price: "$1" },
      ],
      [
        {
          $project: { costsOneDollar: { $eq: ["$price", { $literal: "$1" }] } },
        },
      ]
    );

    expect(result).toEqual([
      { _id: 1, costsOneDollar: false },
      { _id: 2, costsOneDollar: false },
      { _id: 3, costsOneDollar: true },
    ]);
  });
});
