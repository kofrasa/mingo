import "../../../src/init/system";

import { aggregate, find } from "../../../src";

describe("operators/expression/variable", () => {
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

  // See: https://github.com/kofrasa/mingo/issues/302
  it("can access all variables within defined scope", () => {
    const docs = [
      {
        _id: "document1",
        pattern: [
          "string1",
          [
            "descriptor",
            {
              format: "longDate",
              id: "1",
            },
          ],
          "string2",
          [
            "descriptor",
            {
              format: "longDate",
              id: "2",
            },
          ],
          "string3",
          [
            "descriptor",
            {
              format: "longDate",
              id: "3",
            },
          ],
        ],
      },
      {
        _id: "document2",
        pattern: [
          "string1",
          [
            "descriptor",
            {
              format: "longDate",
              id: "4",
            },
          ],
          "string2",
          [
            "descriptor",
            {
              format: "longDate",
              id: "5",
            },
          ],
          "string3",
          [
            "descriptor",
            {
              format: "longDate",
              id: "6",
            },
          ],
        ],
      },
    ];

    const results = find(docs, {
      $expr: {
        $gt: [
          {
            $size: {
              $filter: {
                input: "$pattern",
                as: "p",
                cond: {
                  $and: [
                    {
                      $isArray: ["$$p"],
                    },
                    {
                      $let: {
                        vars: {
                          e: {
                            $arrayElemAt: ["$$p", 1],
                          },
                        },
                        in: {
                          $eq: ["$$e.id", "1"],
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          0,
        ],
      },
    }).all();

    expect(results).toEqual([
      {
        _id: "document1",
        pattern: [
          "string1",
          [
            "descriptor",
            {
              format: "longDate",
              id: "1",
            },
          ],
          "string2",
          [
            "descriptor",
            {
              format: "longDate",
              id: "2",
            },
          ],
          "string3",
          [
            "descriptor",
            {
              format: "longDate",
              id: "3",
            },
          ],
        ],
      },
    ]);
  });
});
