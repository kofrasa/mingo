import "../../src/init/system";

import test from "tape";

import { find } from "../../src";

test("Query Bitwise Operators", (t) => {
  const docs = [
    { _id: 1, a: 54, binaryValueofA: "00110110" },
    { _id: 2, a: 20, binaryValueofA: "00010100" },
    { _id: 3, a: 20.0, binaryValueofA: "00010100" },
    { _id: 4, a: 102, binaryValueofA: "01100110" },
  ];

  // $bitsAllClear
  for (const mask of [[1, 5], 35]) {
    const result = find(docs, { a: { $bitsAllClear: mask } }).all();
    t.deepEqual(
      result,
      [
        { _id: 2, a: 20, binaryValueofA: "00010100" },
        { _id: 3, a: 20, binaryValueofA: "00010100" },
      ],
      `$bitsAllClear with bitmask ${JSON.stringify(mask)}`
    );
  }

  // $bitsAllSet
  {
    let result = find(docs, { a: { $bitsAllSet: [1, 5] } }).all();
    t.deepEqual(
      result,
      [
        { _id: 1, a: 54, binaryValueofA: "00110110" },
        { _id: 4, a: 102, binaryValueofA: "01100110" },
      ],
      `$bitsAllSet with bitmask [1,5]`
    );

    result = find(docs, { a: { $bitsAllSet: 50 } }).all();
    t.deepEqual(
      result,
      [{ _id: 1, a: 54, binaryValueofA: "00110110" }],
      `$bitsAllSet with bitmask 50`
    );
  }

  // $bitsAnyClear
  {
    let result = find(docs, { a: { $bitsAnyClear: [1, 5] } }).all();
    t.deepEqual(
      result,
      [
        { _id: 2, a: 20, binaryValueofA: "00010100" },
        { _id: 3, a: 20, binaryValueofA: "00010100" },
      ],
      `$bitsAnyClear with bitmask [1,5]`
    );

    result = find(docs, { a: { $bitsAnyClear: 35 } }).all();
    t.deepEqual(
      result,
      [
        { _id: 1, a: 54, binaryValueofA: "00110110" },
        { _id: 2, a: 20, binaryValueofA: "00010100" },
        { _id: 3, a: 20, binaryValueofA: "00010100" },
        { _id: 4, a: 102, binaryValueofA: "01100110" },
      ],
      `$bitsAnyClear with bitmask 35`
    );
  }

  // $bitsAnySet
  {
    let result = find(docs, { a: { $bitsAnySet: [1, 5] } }).all();
    t.deepEqual(
      result,
      [
        { _id: 1, a: 54, binaryValueofA: "00110110" },
        { _id: 4, a: 102, binaryValueofA: "01100110" },
      ],
      `$bitsAnySet with bitmask [1,5]`
    );

    result = find(docs, { a: { $bitsAnySet: 35 } }).all();
    t.deepEqual(
      result,
      [
        { _id: 1, a: 54, binaryValueofA: "00110110" },
        { _id: 4, a: 102, binaryValueofA: "01100110" },
      ],
      `$bitsAnySet with bitmask 35`
    );
  }

  t.end();
});
