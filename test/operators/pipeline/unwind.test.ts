import { describe, expect, it } from "vitest";

import { aggregate } from "../../../src";
import { ProcessingMode } from "../../../src/core/_internal";
import { studentsData } from "../../support";

const options = {
  processingMode: ProcessingMode.CLONE_INPUT
};

const data = [
  { _id: 1, item: "ABC", sizes: ["S", "M", "L"] },
  { _id: 2, item: "EFG", sizes: [] },
  { _id: 3, item: "IJK", sizes: "M" },
  { _id: 4, item: "LMN" },
  { _id: 5, item: "XYZ", sizes: null }
];

describe("operators/pipeline/unwind", () => {
  it("can $unwind array value in collection", () => {
    const result = aggregate(
      studentsData,
      [{ $unwind: "$scores" }, { $count: "size" }],
      { ...options, processingMode: ProcessingMode.CLONE_ALL }
    );
    expect(result).toStrictEqual([{ size: 800 }]);
  });

  it("can $unwind with field selector", () => {
    const result = aggregate(data, [{ $unwind: "$sizes" }], {
      ...options,
      processingMode: ProcessingMode.CLONE_ALL
    });
    expect(result).toStrictEqual([
      { _id: 1, item: "ABC", sizes: "S" },
      { _id: 1, item: "ABC", sizes: "M" },
      { _id: 1, item: "ABC", sizes: "L" },
      { _id: 3, item: "IJK", sizes: "M" }
    ]);
  });

  it("can $unwind with object expression", () => {
    const result = aggregate(data, [{ $unwind: { path: "$sizes" } }], options);
    expect(result).toStrictEqual([
      { _id: 1, item: "ABC", sizes: "S" },
      { _id: 1, item: "ABC", sizes: "M" },
      { _id: 1, item: "ABC", sizes: "L" },
      { _id: 3, item: "IJK", sizes: "M" }
    ]);
  });

  it('can $unwind with option "includeArrayIndex"', () => {
    const result = aggregate(
      data,
      [{ $unwind: { path: "$sizes", includeArrayIndex: "arrayIndex" } }],
      options
    );
    expect(result).toStrictEqual([
      { _id: 1, item: "ABC", sizes: "S", arrayIndex: 0 },
      { _id: 1, item: "ABC", sizes: "M", arrayIndex: 1 },
      { _id: 1, item: "ABC", sizes: "L", arrayIndex: 2 },
      { _id: 3, item: "IJK", sizes: "M", arrayIndex: null }
    ]);
  });

  it('can $unwind with option "preserveNullAndEmptyArrays"', () => {
    const result = aggregate(
      data,
      [{ $unwind: { path: "$sizes", preserveNullAndEmptyArrays: true } }],
      options
    );
    expect(result).toStrictEqual([
      { _id: 1, item: "ABC", sizes: "S" },
      { _id: 1, item: "ABC", sizes: "M" },
      { _id: 1, item: "ABC", sizes: "L" },
      { _id: 2, item: "EFG" },
      { _id: 3, item: "IJK", sizes: "M" },
      { _id: 4, item: "LMN" },
      { _id: 5, item: "XYZ", sizes: null }
    ]);
  });

  //https://github.com/kofrasa/mingo/issues/80
  it("$unwind array nested within object", () => {
    const result = aggregate(
      [
        { _id: 1, item: "ABC", a: { sizes: ["S", "M", "L"] } },
        { _id: 2, item: "EFG", a: { sizes: [] } },
        { _id: 3, item: "IJK", a: { sizes: "M" } },
        { _id: 4, item: "LMN", a: {} },
        { _id: 5, item: "XYZ", a: { sizes: null } }
      ],
      [{ $unwind: "$a.sizes" }],
      options
    );
    expect(result).toStrictEqual([
      { _id: 1, item: "ABC", a: { sizes: "S" } },
      { _id: 1, item: "ABC", a: { sizes: "M" } },
      { _id: 1, item: "ABC", a: { sizes: "L" } },
      { _id: 3, item: "IJK", a: { sizes: "M" } }
    ]);
  });

  it("$unwind has 0 value item", () => {
    const result = aggregate(
      [
        { _id: 1, number: 0 },
        { _id: 2, number: 1 }
      ],
      [{ $unwind: "$number" }],
      options
    );
    expect(result).toStrictEqual([
      { _id: 1, number: 0 },
      { _id: 2, number: 1 }
    ]);
  });

  it("$unwind keeps an empty object or empty string as a single value", () => {
    const result = aggregate(
      [
        { _id: 1, a: {} },
        { _id: 2, a: { x: 1 } },
        { _id: 3, a: 5 },
        { _id: 4, a: [] },
        { _id: 5, a: null },
        { _id: 6 },
        { _id: 7, a: [1, 2] },
        { _id: 8, a: "" },
        { _id: 9, a: 0 }
      ],
      [{ $unwind: "$a" }],
      options
    );
    expect(result.map(o => o._id)).toStrictEqual([1, 2, 3, 7, 7, 8, 9]);
    expect(result[0]).toStrictEqual({ _id: 1, a: {} });
    expect(result[5]).toStrictEqual({ _id: 8, a: "" });
  });
});
