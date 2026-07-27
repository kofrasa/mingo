import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { testPath } from "../../support";

describe(testPath(import.meta.url), () => {
  it("Bucket with 'default' value greater than upper bound", () => {
    const res = aggregate(
      [
        { _id: 1, name: "Alice", score: 20 },
        { _id: 2, name: "Bob", score: 55 },
        { _id: 3, name: "Charlie", score: 95 },
        { _id: 4, name: "Daisy", score: 120 },
        { _id: 5, name: "Eve", score: 75 }
      ],
      [
        {
          $bucket: {
            groupBy: "$score", // Field to group by
            boundaries: [0, 50, 100], // Bucket boundaries
            default: 150 // Value that is greater than the upper bound (100) and of the same type (number)
            // default output used when not specified. { count: { $sum: 1 } }
          }
        }
      ]
    );

    expect(res).toEqual([
      { _id: 0, count: 1 }, // Bucket for scores [0, 50): Alice (score 20)
      { _id: 50, count: 3 }, // Bucket for scores [50, 100): Bob, Charlie, Eve
      { _id: 150, count: 1 } // Default bucket: Daisy (score 120)
    ]);
  });

  it("Bucket with 'default' value smaller than lower bound", () => {
    const res = aggregate(
      [
        { _id: 1, name: "Alice", score: 20 },
        { _id: 2, name: "Bob", score: 55 },
        { _id: 3, name: "Charlie", score: 120 },
        { _id: 4, name: "Daisy", score: 170 },
        { _id: 5, name: "Eve", score: 45 }
      ],
      [
        {
          $bucket: {
            groupBy: "$score", // Field to group by
            boundaries: [50, 100, 150], // New bucket boundaries
            default: 0, // Value smaller than the lower boundary (50) and of the same type (number)
            output: {
              count: { $sum: 1 } // Count documents in each bucket
            }
          }
        }
      ]
    );

    expect(res).toEqual([
      { _id: 50, count: 1 }, // Bucket for scores [50, 100): Bob
      { _id: 100, count: 1 }, // Bucket for scores [100, 150): Charlie
      { _id: 0, count: 3 } // Default bucket: Alice (score 20), Daisy (score 170), Eve (score 45)
    ]);
  });

  it("Bucket by Year and Filter Bycket Results", () => {
    const res = aggregate(
      [
        {
          _id: 1,
          last_name: "Bernard",
          first_name: "Emil",
          year_born: 1868,
          year_died: 1941,
          nationality: "France"
        },
        {
          _id: 2,
          last_name: "Rippl-Ronai",
          first_name: "Joszef",
          year_born: 1861,
          year_died: 1927,
          nationality: "Hungary"
        },
        {
          _id: 3,
          last_name: "Ostroumova",
          first_name: "Anna",
          year_born: 1871,
          year_died: 1955,
          nationality: "Russia"
        },
        {
          _id: 4,
          last_name: "Van Gogh",
          first_name: "Vincent",
          year_born: 1853,
          year_died: 1890,
          nationality: "Holland"
        },
        {
          _id: 5,
          last_name: "Maurer",
          first_name: "Alfred",
          year_born: 1868,
          year_died: 1932,
          nationality: "USA"
        },
        {
          _id: 6,
          last_name: "Munch",
          first_name: "Edvard",
          year_born: 1863,
          year_died: 1944,
          nationality: "Norway"
        },
        {
          _id: 7,
          last_name: "Redon",
          first_name: "Odilon",
          year_born: 1840,
          year_died: 1916,
          nationality: "France"
        },
        {
          _id: 8,
          last_name: "Diriks",
          first_name: "Edvard",
          year_born: 1855,
          year_died: 1930,
          nationality: "Norway"
        }
      ],
      [
        {
          $bucket: {
            groupBy: "$year_born", // Field to group by
            boundaries: [1840, 1850, 1860, 1870, 1880], // Boundaries for the buckets
            default: "Other", // Bucket ID for documents which do not fall into a bucket
            output: {
              // Output for each bucket
              count: { $sum: 1 },
              artists: {
                $push: {
                  name: { $concat: ["$first_name", " ", "$last_name"] },
                  year_born: "$year_born"
                }
              }
            }
          }
        }
      ]
    );

    expect(res).toEqual([
      {
        _id: 1840,
        count: 1,
        artists: [{ name: "Odilon Redon", year_born: 1840 }]
      },
      {
        _id: 1850,
        count: 2,
        artists: [
          { name: "Vincent Van Gogh", year_born: 1853 },
          { name: "Edvard Diriks", year_born: 1855 }
        ]
      },
      {
        _id: 1860,
        count: 4,
        artists: [
          { name: "Emil Bernard", year_born: 1868 },
          { name: "Joszef Rippl-Ronai", year_born: 1861 },
          { name: "Alfred Maurer", year_born: 1868 },
          { name: "Edvard Munch", year_born: 1863 }
        ]
      },
      {
        _id: 1870,
        count: 1,
        artists: [{ name: "Anna Ostroumova", year_born: 1871 }]
      }
    ]);
  });

  it("Bucket by Multiple Fields", () => {
    const res = aggregate(
      [
        {
          _id: 1,
          title: "The Pillars of Society",
          artist: "Grosz",
          year: 1926,
          price: 199.99,
          tags: ["painting", "satire", "Expressionism", "caricature"]
        },
        {
          _id: 2,
          title: "Melancholy III",
          artist: "Munch",
          year: 1902,
          price: 280.0,
          tags: ["woodcut", "Expressionism"]
        },
        {
          _id: 3,
          title: "Dancer",
          artist: "Miro",
          year: 1925,
          price: 76.04,
          tags: ["oil", "Surrealism", "painting"]
        },
        {
          _id: 4,
          title: "The Great Wave off Kanagawa",
          artist: "Hokusai",
          price: 167.3,
          tags: ["woodblock", "ukiyo-e"]
        },
        {
          _id: 5,
          title: "The Persistence of Memory",
          artist: "Dali",
          year: 1931,
          price: 483.0,
          tags: ["Surrealism", "painting", "oil"]
        },
        {
          _id: 6,
          title: "Composition VII",
          artist: "Kandinsky",
          year: 1913,
          price: 385.0,
          tags: ["oil", "painting", "abstract"]
        },
        {
          _id: 7,
          title: "The Scream",
          artist: "Munch",
          year: 1893,
          tags: ["Expressionism", "painting", "oil"]
        },
        {
          _id: 8,
          title: "Blue Flower",
          artist: "O'Keefe",
          year: 1918,
          price: 118.42,
          tags: ["abstract", "painting"]
        }
      ],
      [
        {
          $bucket: {
            groupBy: "$price",
            boundaries: [0, 200, 400],
            default: "Other",
            output: {
              count: { $sum: 1 },
              titles: { $push: "$title" }
            }
          }
        }
      ]
    );

    expect(res).toEqual([
      {
        _id: 0,
        count: 4,
        titles: [
          "The Pillars of Society",
          "Dancer",
          "The Great Wave off Kanagawa",
          "Blue Flower"
        ]
      },
      {
        _id: 200,
        count: 2,
        titles: ["Melancholy III", "Composition VII"]
      },
      {
        _id: "Other",
        count: 2,
        titles: ["The Persistence of Memory", "The Scream"]
      }
    ]);
  });
});
