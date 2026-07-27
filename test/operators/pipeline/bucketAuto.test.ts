import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { AnyObject } from "../../../src/types";
import { testPath } from "../../support";

describe(testPath(import.meta.url), () => {
  const things: AnyObject[] = [];
  for (let i = 0; i < 100; i++) things.push({ _id: i });

  const artwork = [
    {
      _id: 1,
      title: "The Pillars of Society",
      artist: "Grosz",
      year: 1926,
      price: 199.99,
      dimensions: { height: 39, width: 21, units: "in" }
    },
    {
      _id: 2,
      title: "Melancholy III",
      artist: "Munch",
      year: 1902,
      price: 280.0,
      dimensions: { height: 49, width: 32, units: "in" }
    },
    {
      _id: 3,
      title: "Dancer",
      artist: "Miro",
      year: 1925,
      price: 76.04,
      dimensions: { height: 25, width: 20, units: "in" }
    },
    {
      _id: 4,
      title: "The Great Wave off Kanagawa",
      artist: "Hokusai",
      price: 167.3,
      dimensions: { height: 24, width: 36, units: "in" }
    },
    {
      _id: 5,
      title: "The Persistence of Memory",
      artist: "Dali",
      year: 1931,
      price: 483.0,
      dimensions: { height: 20, width: 24, units: "in" }
    },
    {
      _id: 6,
      title: "Composition VII",
      artist: "Kandinsky",
      year: 1913,
      price: 385.0,
      dimensions: { height: 30, width: 46, units: "in" }
    },
    {
      _id: 7,
      title: "The Scream",
      artist: "Munch",
      price: 159.0,
      dimensions: { height: 24, width: 18, units: "in" }
    },
    {
      _id: 8,
      title: "Blue Flower",
      artist: "O'Keefe",
      year: 1918,
      price: 118.42,
      dimensions: { height: 24, width: 20, units: "in" }
    }
  ];

  it("Single Facet Aggregation", () => {
    const result = aggregate(artwork, [
      {
        $bucketAuto: {
          groupBy: "$price",
          buckets: 4
        }
      }
    ]);

    expect(result).toEqual([
      { _id: { min: 76.04, max: 159 }, count: 2 },
      { _id: { min: 159, max: 199.99 }, count: 2 },
      { _id: { min: 199.99, max: 385 }, count: 2 },
      { _id: { min: 385, max: 483 }, count: 2 }
    ]);
  });

  it("Multi-Faceted Aggregation", () => {
    const result = aggregate(artwork, [
      {
        $facet: {
          price: [
            {
              $bucketAuto: {
                groupBy: "$price",
                buckets: 4
              }
            }
          ],
          year: [
            {
              $bucketAuto: {
                groupBy: "$year",
                buckets: 3,
                output: {
                  count: { $sum: 1 },
                  years: { $push: "$year" }
                }
              }
            }
          ],
          area: [
            {
              $bucketAuto: {
                groupBy: {
                  $multiply: ["$dimensions.height", "$dimensions.width"]
                },
                buckets: 4,
                output: {
                  count: { $sum: 1 },
                  titles: { $push: "$title" }
                }
              }
            }
          ]
        }
      }
    ]);

    expect(result).toEqual([
      {
        area: [
          {
            _id: { min: 432, max: 500 },
            count: 3,
            titles: ["The Scream", "The Persistence of Memory", "Blue Flower"]
          },
          {
            _id: { min: 500, max: 864 },
            count: 2,
            titles: ["Dancer", "The Pillars of Society"]
          },
          {
            _id: { min: 864, max: 1568 },
            count: 2,
            titles: ["The Great Wave off Kanagawa", "Composition VII"]
          },
          {
            _id: { min: 1568, max: 1568 },
            count: 1,
            titles: ["Melancholy III"]
          }
        ],
        price: [
          {
            _id: { min: 76.04, max: 159.0 },
            count: 2
          },
          {
            _id: { min: 159.0, max: 199.99 },
            count: 2
          },
          {
            _id: { min: 199.99, max: 385.0 },
            count: 2
          },
          {
            _id: { min: 385.0, max: 483.0 },
            count: 2
          }
        ],
        year: [
          { _id: { min: null, max: 1913 }, count: 3, years: [1902] },
          {
            _id: { min: 1913, max: 1926 },
            count: 3,
            years: [1913, 1918, 1925]
          },
          { _id: { min: 1926, max: 1931 }, count: 2, years: [1926, 1931] }
        ]
      }
    ]);
  });

  it.each([
    [
      "",
      {
        buckets: 1,
        output: [{ _id: { min: 0, max: 99 }, count: 100 }]
      }
    ],
    [
      "",
      {
        buckets: 5,
        output: [
          { _id: { min: 0, max: 20 }, count: 20 },
          { _id: { min: 20, max: 40 }, count: 20 },
          { _id: { min: 40, max: 60 }, count: 20 },
          { _id: { min: 60, max: 80 }, count: 20 },
          { _id: { min: 80, max: 99 }, count: 20 }
        ]
      }
    ],
    [
      "",
      {
        buckets: 7,
        output: [
          { _id: { max: 14, min: 0 }, count: 14 },
          { _id: { max: 28, min: 14 }, count: 14 },
          { _id: { max: 42, min: 28 }, count: 14 },
          { _id: { max: 56, min: 42 }, count: 14 },
          { _id: { max: 70, min: 56 }, count: 14 },
          { _id: { max: 84, min: 70 }, count: 14 },
          { _id: { max: 99, min: 84 }, count: 16 }
        ]
      }
    ],
    [
      "R5",
      {
        buckets: 1,
        output: [{ _id: { max: 100, min: 0 }, count: 100 }]
      }
    ],
    [
      "R5",
      {
        buckets: 5,
        output: [
          { _id: { max: 25, min: 0 }, count: 25 },
          { _id: { max: 63, min: 25 }, count: 38 },
          { _id: { max: 100, min: 63 }, count: 37 }
        ]
      }
    ],
    [
      "R5",
      {
        buckets: 7,
        output: [
          { _id: { max: 16, min: 0 }, count: 16 },
          { _id: { max: 40, min: 16 }, count: 24 },
          { _id: { max: 63, min: 40 }, count: 23 },
          { _id: { max: 100, min: 63 }, count: 37 }
        ]
      }
    ],
    [
      "R5",
      {
        buckets: 12,
        output: [
          { _id: { max: 10, min: 0 }, count: 10 },
          { _id: { max: 25, min: 10 }, count: 15 },
          { _id: { max: 40, min: 25 }, count: 15 },
          { _id: { max: 63, min: 40 }, count: 23 },
          { _id: { max: 100, min: 63 }, count: 37 }
        ]
      }
    ],
    [
      "R20",
      {
        buckets: 5,
        output: [
          { _id: { min: 0, max: 20 }, count: 20 },
          { _id: { min: 20, max: 40 }, count: 20 },
          { _id: { min: 40, max: 63 }, count: 23 },
          { _id: { min: 63, max: 90 }, count: 27 },
          { _id: { min: 90, max: 100 }, count: 10 }
        ]
      }
    ],
    [
      "E24",
      {
        buckets: 5,
        output: [
          { _id: { min: 0, max: 20 }, count: 20 },
          { _id: { min: 20, max: 43 }, count: 23 },
          { _id: { min: 43, max: 68 }, count: 25 },
          { _id: { min: 68, max: 91 }, count: 23 },
          { _id: { min: 91, max: 100 }, count: 9 }
        ]
      }
    ],
    [
      "E192",
      {
        buckets: 5,
        output: [
          {
            _id: { max: 19.1, min: 0 },
            count: 20
          },
          {
            _id: { max: 39.2, min: 19.1 },
            count: 20
          },
          {
            _id: { max: 59.7, min: 39.2 },
            count: 20
          },
          {
            _id: { max: 79.60000000000001, min: 59.7 },
            count: 20
          },
          {
            _id: { max: 100, min: 79.60000000000001 },
            count: 20
          }
        ]
      }
    ],
    [
      "1-2-5",
      {
        buckets: 1,
        output: [{ _id: { max: 100, min: 0 }, count: 100 }]
      }
    ],
    [
      "1-2-5",
      {
        buckets: 5,
        output: [
          { _id: { max: 20, min: 0 }, count: 20 },
          { _id: { max: 50, min: 20 }, count: 30 },
          { _id: { max: 100, min: 50 }, count: 50 }
        ]
      }
    ],
    [
      "1-2-5",
      {
        buckets: 7,
        output: [
          { _id: { min: 0, max: 20 }, count: 20 },
          { _id: { min: 20, max: 50 }, count: 30 },
          { _id: { min: 50, max: 100 }, count: 50 }
        ]
      }
    ],
    [
      "1-2-5",
      {
        buckets: 12,
        output: [
          { _id: { max: 10, min: 0 }, count: 10 },
          { _id: { max: 20, min: 10 }, count: 10 },
          { _id: { max: 50, min: 20 }, count: 30 },
          { _id: { max: 100, min: 50 }, count: 50 }
        ]
      }
    ],
    [
      "POWERSOF2",
      {
        buckets: 1,
        output: [{ _id: { min: 0, max: 128 }, count: 100 }]
      }
    ],
    [
      "POWERSOF2",
      {
        buckets: 5,
        output: [
          { _id: { min: 0, max: 32 }, count: 32 },
          { _id: { min: 32, max: 64 }, count: 32 },
          { _id: { min: 64, max: 128 }, count: 36 }
        ]
      }
    ],
    [
      "POWERSOF2",
      {
        buckets: 7,
        output: [
          { _id: { max: 16, min: 0 }, count: 16 },
          { _id: { max: 32, min: 16 }, count: 16 },
          { _id: { max: 64, min: 32 }, count: 32 },
          { _id: { max: 128, min: 64 }, count: 36 }
        ]
      }
    ],
    [
      "POWERSOF2",
      {
        buckets: 12,
        output: [
          { _id: { max: 8, min: 0 }, count: 8 },
          { _id: { max: 16, min: 8 }, count: 8 },
          { _id: { max: 32, min: 16 }, count: 16 },
          { _id: { max: 64, min: 32 }, count: 32 },
          { _id: { max: 128, min: 64 }, count: 36 }
        ]
      }
    ]
  ])(
    "Comparing Different Granularities - %p, buckets: %p",
    (granularity, { buckets, output }) => {
      const actual = aggregate(things, [
        {
          $bucketAuto: {
            groupBy: "$_id",
            buckets,
            granularity
          }
        }
      ]);
      expect(actual).toEqual(output);
    }
  );
});
