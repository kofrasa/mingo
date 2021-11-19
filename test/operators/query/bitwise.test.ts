import "../../../src/init/system";

import { find } from "../../../src";

describe("operatots/query/bitwise", () => {
  const docs = [
    { _id: 1, a: 54, binaryValueofA: "00110110" },
    { _id: 2, a: 20, binaryValueofA: "00010100" },
    { _id: 3, a: 20.0, binaryValueofA: "00010100" },
    { _id: 4, a: 102, binaryValueofA: "01100110" },
  ];

  // $bitsAllClear
  it("can match with $bitsAllClear", () => {
    for (const mask of [[1, 5], 35]) {
      const result = find(docs, { a: { $bitsAllClear: mask } }).all();
      expect(result).toEqual([
        { _id: 2, a: 20, binaryValueofA: "00010100" },
        { _id: 3, a: 20, binaryValueofA: "00010100" },
      ]);
    }
  });

  // $bitsAllSet
  it("can match with $bitsAllSet", () => {
    let result = find(docs, { a: { $bitsAllSet: [1, 5] } }).all();
    expect(result).toEqual([
      { _id: 1, a: 54, binaryValueofA: "00110110" },
      { _id: 4, a: 102, binaryValueofA: "01100110" },
    ]);

    result = find(docs, { a: { $bitsAllSet: 50 } }).all();
    expect(result).toEqual([{ _id: 1, a: 54, binaryValueofA: "00110110" }]);
  });

  // $bitsAnyClear
  it("can match with $bitsAnyClear", () => {
    let result = find(docs, { a: { $bitsAnyClear: [1, 5] } }).all();
    expect(result).toEqual([
      { _id: 2, a: 20, binaryValueofA: "00010100" },
      { _id: 3, a: 20, binaryValueofA: "00010100" },
    ]);

    result = find(docs, { a: { $bitsAnyClear: 35 } }).all();
    expect(result).toEqual([
      { _id: 1, a: 54, binaryValueofA: "00110110" },
      { _id: 2, a: 20, binaryValueofA: "00010100" },
      { _id: 3, a: 20, binaryValueofA: "00010100" },
      { _id: 4, a: 102, binaryValueofA: "01100110" },
    ]);
  });

  // $bitsAnySet
  it("can match with $bitsAnyClear", () => {
    let result = find(docs, { a: { $bitsAnySet: [1, 5] } }).all();
    expect(result).toEqual([
      { _id: 1, a: 54, binaryValueofA: "00110110" },
      { _id: 4, a: 102, binaryValueofA: "01100110" },
    ]);

    result = find(docs, { a: { $bitsAnySet: 35 } }).all();
    expect(result).toEqual([
      { _id: 1, a: 54, binaryValueofA: "00110110" },
      { _id: 4, a: 102, binaryValueofA: "01100110" },
    ]);
  });
});
