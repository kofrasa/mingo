import "../../src/init/system";

import { aggregate } from "../../src";

describe("expression/variable", () => {
  it("can apply $let operator", () => {
    const result = aggregate(
      [
        { _id: 1, price: 10, tax: 0.5, applyDiscount: true },
        { _id: 2, price: 10, tax: 0.25, applyDiscount: false },
      ],
      [
        {
          $project: {
            finalTotal: {
              $let: {
                vars: {
                  total: { $add: ["$price", "$tax"] },
                  discounted: {
                    $cond: { if: "$applyDiscount", then: 0.9, else: 1 },
                  },
                },
                in: { $multiply: ["$$total", "$$discounted"] },
              },
            },
          },
        },
      ]
    ) as Array<{ finalTotal: number }>;

    expect(result[0].finalTotal).toEqual(9.450000000000001);
    expect(result[1].finalTotal).toEqual(10.25);
  });
});
