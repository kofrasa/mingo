import "./../../../../src/init/system";

import { aggregate } from "../../../../src";
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

describe(`${support.testPath(__filename)}: More tests`, () => {
  it("should resolve fields with both variables and current object", () => {
    const result = aggregate(
      [
        {
          skills: {
            data: [
              {
                name: "Respiratory Therapst",
                categories: {
                  data: [
                    {
                      name: "Healthcare",
                    },
                  ],
                },
              },
              {
                name: "Phlebotomy",
                categories: {
                  data: [
                    {
                      name: "Skills (N-R) - DNU for Postings",
                    },
                    {
                      name: "Healthcare",
                    },
                  ],
                },
              },
            ],
          },
          location: "abcd",
        },
      ],
      [
        {
          $project: {
            specialties: {
              $reduce: {
                input: "$skills.data",
                initialValue: [],
                in: {
                  $concatArrays: [
                    "$$value",
                    {
                      $map: {
                        input: "$$this.categories.data",
                        as: "category",
                        in: {
                          skill: "$$this.name",
                          category: "$$category.name",
                        },
                      },
                    },
                  ],
                },
              },
            },
            location: "$location",
          },
        },
      ]
    );

    expect(result).toEqual([
      {
        specialties: [
          {
            skill: "Respiratory Therapst",
            category: "Healthcare",
          },
          {
            skill: "Phlebotomy",
            category: "Skills (N-R) - DNU for Postings",
          },
          {
            skill: "Phlebotomy",
            category: "Healthcare",
          },
        ],
        location: "abcd",
      },
    ]);
  });
});
