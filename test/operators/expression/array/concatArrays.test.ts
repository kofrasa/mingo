import { describe, expect, it } from "vitest";

import { aggregate } from "../../../../src";
import { runTest, testPath } from "../../../support";

runTest(testPath(import.meta.url) + "_Expression", {
  $concatArrays: [
    [[null], null],
    [null, null],
    // error: not an array input
    ["invalid", Error()],
    ["invalid", null, { failOnError: false }],
    [[[1, 2, 3], "invalid"], Error()],
    [[[1, 2, 3], "invalid"], null, { failOnError: false }],
    [[["hello", " "], null], null],
    [
      [["hello", " "], ["world"]],
      ["hello", " ", "world"]
    ],
    [
      [
        ["hello", " "],
        [["world"], "again"]
      ],
      ["hello", " ", ["world"], "again"]
    ],
    [
      [
        ["hello", " "],
        [["universe"], "again"],
        ["and", "bye"]
      ],
      ["hello", " ", ["universe"], "again", "and", "bye"]
    ]
  ]
});

describe(testPath(import.meta.url) + "__Accumulator", () => {
  it("should accept expression as argument", () => {
    const res = aggregate(
      [
        {
          _id: 1,
          items: ["laptop", "tablet"],
          location: "NYC"
        },
        {
          _id: 2,
          items: ["phone", "tablet"],
          location: "NYC"
        },
        {
          _id: 3,
          location: "NYC"
        },
        {
          _id: 4,
          items: ["desktop", { accessories: ["mouse", "keyboard"] }],
          location: "NYC"
        }
      ],
      [
        {
          $group: {
            _id: "$location",
            array: { $concatArrays: "$items" }
          }
        }
      ]
    );

    expect(res).toEqual([
      {
        _id: "NYC",
        array: [
          "laptop",
          "tablet",
          "phone",
          "tablet",
          "desktop",
          { accessories: ["mouse", "keyboard"] }
        ]
      }
    ]);
  });

  it("should accept array value as argument", () => {
    const res = aggregate(
      [
        { _id: 1, instock: ["chocolate"], ordered: ["butter", "apples"] },
        { _id: 2, instock: ["apples", "pudding", "pie"] },
        { _id: 3, instock: ["pears", "pecans"], ordered: ["cherries"] },
        { _id: 4, instock: ["ice cream"], ordered: [] }
      ],
      [{ $project: { items: { $concatArrays: ["$instock", "$ordered"] } } }]
    );

    expect(res).toEqual([
      { _id: 1, items: ["chocolate", "butter", "apples"] },
      { _id: 2, items: null },
      { _id: 3, items: ["pears", "pecans", "cherries"] },
      { _id: 4, items: ["ice cream"] }
    ]);
  });
});
