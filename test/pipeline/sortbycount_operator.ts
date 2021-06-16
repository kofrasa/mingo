import test from "tape";

import { aggregate } from "../../src";

/**
 * Tests for $sortByCount operator
 */
test("$sortByCount pipeline operator", (t) => {
  const exhibits = [
    {
      _id: 1,
      title: "The Pillars of Society",
      artist: "Grosz",
      year: 1926,
      tags: ["painting", "satire", "Expressionism", "caricature"],
    },
    {
      _id: 2,
      title: "Melancholy III",
      artist: "Munch",
      year: 1902,
      tags: ["woodcut", "Expressionism"],
    },
    {
      _id: 3,
      title: "Dancer",
      artist: "Miro",
      year: 1925,
      tags: ["oil", "Surrealism", "painting"],
    },
    {
      _id: 4,
      title: "The Great Wave off Kanagawa",
      artist: "Hokusai",
      tags: ["woodblock", "ukiyo-e"],
    },
    {
      _id: 5,
      title: "The Persistence of Memory",
      artist: "Dali",
      year: 1931,
      tags: ["Surrealism", "painting", "oil"],
    },
    {
      _id: 6,
      title: "Composition VII",
      artist: "Kandinsky",
      year: 1913,
      tags: ["oil", "painting", "abstract"],
    },
    {
      _id: 7,
      title: "The Scream",
      artist: "Munch",
      year: 1893,
      tags: ["Expressionism", "painting", "oil"],
    },
    {
      _id: 8,
      title: "Blue Flower",
      artist: "O'Keefe",
      year: 1918,
      tags: ["abstract", "painting"],
    },
  ];

  const result = aggregate(exhibits, [
    { $unwind: "$tags" },
    { $sortByCount: "$tags" },
  ]);

  t.equals(
    result.every((o) => {
      return Object.keys(o).length === 2;
    }),
    true,
    "validate result return only 2 keys"
  );

  t.equals(result[0]["count"], 6, "validate sorted max first");
  t.equals(result[7]["count"], 1, "validate sorted min last");

  // cannot enable below due to sort order variation
  // t.deepEqual(Object.keys(result[0])["count"], 6[
  //   { "_id" : "painting", "count" : 6 },
  //   { "_id" : "oil", "count" : 4 },
  //   { "_id" : "Expressionism", "count" : 3 },
  //   { "_id" : "Surrealism", "count" : 2 },
  //   { "_id" : "abstract", "count" : 2 },
  //   { "_id" : "woodblock", "count" : 1 },
  //   { "_id" : "woodcut", "count" : 1 },
  //   { "_id" : "ukiyo-e", "count" : 1 },
  //   { "_id" : "satire", "count" : 1 },
  //   { "_id" : "caricature", "count" : 1 }
  // ], "can apply $sortByCount pipeline operator");

  t.end();
});
