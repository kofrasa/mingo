import * as support from "../support";

support.runTest("Array Operators", {
  $arrayElemAt: [
    [[[1, 2, 3], 0], 1],
    [[[1, 2, 3], -2], 2],
    [[[1, 2, 3], 15], undefined],
  ],
  $arrayToObject: [
    [
      {
        $arrayToObject: {
          $literal: [
            { k: "item", v: "abc123" },
            { k: "qty", v: 25 },
          ],
        },
      },
      { item: "abc123", qty: 25 },
    ],
    [
      {
        $arrayToObject: {
          $literal: [
            ["item", "abc123"],
            ["qty", 25],
          ],
        },
      },
      { item: "abc123", qty: 25 },
    ],
  ],
  $concatArrays: [
    [[["hello", " "], null], null],
    [
      [["hello", " "], ["world"]],
      ["hello", " ", "world"],
    ],
    [
      [
        ["hello", " "],
        [["world"], "again"],
      ],
      ["hello", " ", ["world"], "again"],
    ],
    [
      [
        ["hello", " "],
        [["universe"], "again"],
        ["and", "bye"],
      ],
      ["hello", " ", ["universe"], "again", "and", "bye"],
    ],
  ],
  $filter: [
    [
      {
        input: [1, "a", 2, null, 3.1, 4, "5"],
        as: "num",
        cond: {
          $and: [
            { $gte: ["$$num", Number.MIN_SAFE_INTEGER] },
            { $lte: ["$$num", Number.MAX_SAFE_INTEGER] },
          ],
        },
      },
      [1, 2, 3.1, 4],
    ],
  ],
  $first: [
    [[1, 2, 3], 1],
    [[[]], []],
    [[null], null],
    [[], undefined],
    [null, null],
    [undefined, null],
    [5, null, { err: true }],
  ],
  $last: [
    [[1, 2, 3], 3],
    [[[]], []],
    [[null], null],
    [[], undefined],
    [null, null],
    [undefined, null],
    [5, null, { err: true }],
  ],
  $in: [
    [[2, [1, 2, 3]], true],
    [["abc", ["xyz", "abc"]], true],
    [["xy", ["xyz", "abc"]], false],
    [[["a"], ["a"]], false],
    [[["a"], [["a"]]], true],
    [[/^a/, ["a"]], false],
    [[/^a/, [/^a/]], true],
  ],
  $indexOfArray: [
    [null, null],
    [[["a", "abc"], "a"], 0],
    [[["a", "abc", "de", ["de"]], ["de"]], 3],
    [[[1, 2], 5], -1],
    [
      [
        [1, 2, 3],
        [1, 2],
      ],
      -1,
    ],
    [[[10, 9, 9, 8, 9], 9, 3], 4],
    [[["a", "abc", "b"], "b", 0, 1], -1],
    [[["a", "abc", "b"], "b", 1, 0], -1],
    [[["a", "abc", "b"], "b", 20], -1],
    [[[null, null, null], null], 0],
    [[null, "foo"], null],
    [
      ["foo", "foo"],
      "$indexOfArray expression must resolve to an array.",
      { err: true },
    ],
  ],
  $isArray: [
    [["hello"], false],
    [[["hello", "world"]], true],
  ],
  $objectToArray: [
    [
      { item: "foo", qty: 25 },
      [
        { k: "item", v: "foo" },
        { k: "qty", v: 25 },
      ],
    ],
    [
      {
        item: "foo",
        qty: 25,
        size: { len: 25, w: 10, uom: "cm" },
      },
      [
        { k: "item", v: "foo" },
        { k: "qty", v: 25 },
        { k: "size", v: { len: 25, w: 10, uom: "cm" } },
      ],
    ],
  ],
  $range: [
    [
      [0, 10, 2],
      [0, 2, 4, 6, 8],
    ],
    [
      [10, 0, -2],
      [10, 8, 6, 4, 2],
    ],
    [[0, 10, -2], []],
    [
      [0, 5],
      [0, 1, 2, 3, 4],
    ],
  ],
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
  $reverseArray: [
    [
      [1, 2, 3],
      [3, 2, 1],
    ],
    [
      { $reverseArray: { $slice: [["foo", "bar", "baz", "qux"], 1, 2] } },
      ["baz", "bar"],
    ],
    [null, null],
    [[], []],
    [
      [
        [1, 2, 3],
        [4, 5, 6],
      ],
      [
        [4, 5, 6],
        [1, 2, 3],
      ],
    ],
  ],
  $size: [
    [["a", "b", "c"], 3],
    [[10], 1],
    [[], 0],
  ],
  $slice: [
    [[[1, 2, 3], 1, 1], [2]],
    [
      [[1, 2, 3], -2],
      [2, 3],
    ],
    [[[1, 2, 3], 15, 2], []],
    [
      [[1, 2, 3], -15, 2],
      [1, 2],
    ],
  ],
  $zip: [
    [{ inputs: [["a"], null] }, null],
    [{ inputs: [["a"], ["b"], ["c"]] }, [["a", "b", "c"]]],
    [{ inputs: [["a"], ["b", "c"]] }, [["a", "b"]]],
    [
      {
        inputs: [[1], [2, 3]],
        useLongestLength: true,
      },
      [
        [1, 2],
        [null, 3],
      ],
    ],
    // Because useLongestLength: true, $zip will pad the shorter input arrays with the corresponding defaults elements.
    [
      {
        inputs: [[1], [2, 3], [4]],
        useLongestLength: true,
        defaults: ["a", "b", "c"],
      },
      [
        [1, 2, 4],
        ["a", 3, "c"],
      ],
    ],
  ],
  $mergeObjects: [
    [[{ a: 1 }, null], { a: 1 }],
    [[null, null], {}],
    [[{ a: 1 }, { a: 2, b: 2 }, { a: 3, c: 3 }], { a: 3, b: 2, c: 3 }],
    [
      [{ a: 1 }, { a: 2, b: 2 }, { a: 3, b: null, c: 3 }],
      { a: 3, b: null, c: 3 },
    ],
  ],
  $map: [
    [
      {
        input: [5, 6, 7],
        as: "grade",
        in: { $add: ["$$grade", 2] },
      },
      [7, 8, 9],
    ],
    [
      {
        input: [],
        as: "grade",
        in: { $add: ["$$grade", 2] },
      },
      [],
    ],
    [
      {
        input: [3, 8, 9],
        in: { $add: ["$$this", 2] },
      },
      [5, 10, 11],
    ],
  ],
});
