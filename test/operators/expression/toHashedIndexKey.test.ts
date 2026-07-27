import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { testPath } from "../../support";

describe(testPath(import.meta.url), () => {
  it("Computes and returns the hash value of the input expression", () => {
    const data = [
      { item: "" },
      { item: null },
      { item: undefined },
      { item: true },
      { item: false },
      { item: 0 },
      { item: "0" },
      { item: 123 },
      { item: -123 },
      { item: "123" },
      { item: "-123" },
      { item: 3.14 },
      { item: -3.14 },
      { item: "3.14" },
      { item: "-3.14" },
      { item: [] },
      { item: {} },
      { item: [1, 2, 3] },
      { item: { a: 1, b: 2 } }
    ];

    const result = aggregate(data, [
      {
        $addFields: {
          hashedKey: { $toHashedIndexKey: "$item" }
        }
      }
    ]);

    const set = new Set(result.map(v => v["hashedKey"]));
    // expect all unique hashes
    expect(set.size).toEqual(result.length);
  });
});
