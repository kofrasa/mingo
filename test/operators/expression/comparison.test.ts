import { runTest, testPath } from "../../support";

runTest(testPath(import.meta.url), {
  $eq: [
    // Numbers
    [[1, 1], true],
    [[1, 2], false],
    [[0, 0], true],
    [[-1, -1], true],
    [[-1, 1], false],
    [[1, 1.0], true],
    [[1.5, 1.5], true],
    [[1.5, 1], false],
    [[Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER], true],

    // Strings
    [["hello", "hello"], true],
    [["hello", "world"], false],
    [["", ""], true],
    [["Hello", "hello"], false],
    [["hello", "Hello"], false],

    // Booleans
    [[true, true], true],
    [[false, false], true],
    [[true, false], false],
    [[false, true], false],

    // Null
    [[null, null], true],
    [[null, 0], false],
    [[null, false], false],
    [[null, ""], false],

    // Arrays
    [[[], []], true],
    [[[1], [1]], true],
    [[[1], [2]], false],
    [
      [
        [1, 2],
        [1, 2]
      ],
      true
    ],
    [
      [
        [1, 2],
        [2, 1]
      ],
      false
    ],
    [[[1], [1, 2]], false],
    [
      [
        [1, [2]],
        [1, [2]]
      ],
      true
    ],
    [
      [
        [1, [2]],
        [1, [3]]
      ],
      false
    ],
    [[[null], [null]], true],

    // Objects
    [[{}, {}], true],
    [[{ a: 1 }, { a: 1 }], true],
    [[{ a: 1 }, { a: 2 }], false],
    [[{ a: 1 }, { b: 1 }], false],
    [[{ a: { b: 2 } }, { a: { b: 2 } }], true],
    [[{ a: [1, 2] }, { a: [1, 2] }], true],
    [
      [
        { a: 1, b: 2 },
        { b: 2, a: 1 }
      ],
      true
    ],

    // Different types
    [[1, "1"], false],
    [[0, false], false],
    [["1", true], false],
    [[[], {}], false],

    // Field references
    [["$a", "$b"], true, { obj: { a: 10, b: 10 } }],
    [["$a", "$b"], false, { obj: { a: 10, b: 20 } }],
    [["$a", 10], true, { obj: { a: 10 } }],
    [["$a", 10], false, { obj: { a: 20 } }],
    [["$a", null], true, { obj: { a: null } }],
    [["$a", null], false, { obj: { a: 1 } }],
    [["$a", "$b"], true, { obj: { a: [1, 2], b: [1, 2] } }],
    [["$a", "$b"], true, { obj: { a: { x: 1 }, b: { x: 1 } } }]
  ],

  $ne: [
    // Numbers
    [[1, 1], false],
    [[1, 2], true],
    [[0, 0], false],
    [[-1, 1], true],
    [[1, 1.0], false],
    [[1.5, 1], true],

    // Strings
    [["hello", "hello"], false],
    [["hello", "world"], true],
    [["", ""], false],
    [["Hello", "hello"], true],

    // Booleans
    [[true, true], false],
    [[false, false], false],
    [[true, false], true],

    // Null
    [[null, null], false],
    [[null, 0], true],
    [[null, false], true],
    [[null, ""], true],

    // Arrays
    [[[], []], false],
    [[[1], [1]], false],
    [[[1], [2]], true],
    [
      [
        [1, 2],
        [2, 1]
      ],
      true
    ],
    [[[1], [1, 2]], true],
    [
      [
        [1, [2]],
        [1, [3]]
      ],
      true
    ],

    // Objects
    [[{}, {}], false],
    [[{ a: 1 }, { a: 1 }], false],
    [[{ a: 1 }, { a: 2 }], true],
    [[{ a: 1 }, { b: 1 }], true],
    [[{ a: { b: 2 } }, { a: { b: 3 } }], true],
    [
      [
        { a: 1, b: 2 },
        { b: 2, a: 1 }
      ],
      false
    ],

    // Different types
    [[1, "1"], true],
    [[0, false], true],
    [["1", true], true],

    // Field references
    [["$a", "$b"], false, { obj: { a: 10, b: 10 } }],
    [["$a", "$b"], true, { obj: { a: 10, b: 20 } }],
    [["$a", 10], false, { obj: { a: 10 } }],
    [["$a", 10], true, { obj: { a: 20 } }],
    [["$a", null], false, { obj: { a: null } }],
    [["$a", null], true, { obj: { a: 1 } }]
  ],

  $gt: [
    // Numbers
    [[2, 1], true],
    [[1, 2], false],
    [[1, 1], false],
    [[0, -1], true],
    [[-1, 0], false],
    [[1.1, 1], true],
    [[1, 1.1], false],
    [[-1, -2], true],
    [[-2, -1], false],
    [[1000000, 999999], true],

    // Strings
    [["b", "a"], true],
    [["a", "b"], false],
    [["a", "a"], false],
    [["hello", "Hello"], true],
    [["Hello", "hello"], false],
    [["", "a"], false],
    [["a", ""], true],

    // Booleans
    [[true, false], true],
    [[false, true], false],
    [[true, true], false],
    [[false, false], false],

    // Null
    [[null, null], false],
    [[1, null], true],
    [[null, 1], false],

    // Arrays
    [[[2], [1]], true],
    [[[1], [2]], false],
    [
      [
        [1, 2],
        [1, 1]
      ],
      true
    ],
    [
      [
        [1, 1],
        [1, 2]
      ],
      false
    ],
    [[[], []], false],
    [[[1], []], true],
    [[[], [1]], false],

    // Objects
    [[{ a: 2 }, { a: 1 }], true],
    [[{ a: 1 }, { a: 2 }], false],

    // Field references
    [["$a", "$b"], true, { obj: { a: 20, b: 10 } }],
    [["$a", "$b"], false, { obj: { a: 10, b: 20 } }],
    [["$a", 10], true, { obj: { a: 11 } }],
    [["$a", 10], false, { obj: { a: 10 } }],
    [["$a", 10], false, { obj: { a: 9 } }]
  ],

  $gte: [
    // Numbers
    [[2, 1], true],
    [[1, 2], false],
    [[1, 1], true],
    [[0, -1], true],
    [[-1, 0], false],
    [[1.1, 1], true],
    [[1, 1.1], false],
    [[-1, -1], true],

    // Strings
    [["b", "a"], true],
    [["a", "b"], false],
    [["a", "a"], true],
    [["hello", "Hello"], true],
    [["Hello", "hello"], false],
    [["", ""], true],

    // Booleans
    [[true, false], true],
    [[false, true], false],
    [[true, true], true],
    [[false, false], true],

    // Null
    [[null, null], true],
    [[1, null], true],
    [[null, 1], false],

    // Arrays
    [[[2], [1]], true],
    [[[1], [2]], false],
    [[[1], [1]], true],
    [
      [
        [1, 2],
        [1, 1]
      ],
      true
    ],
    [[[], []], true],
    [[[1], []], true],
    [[[], [1]], false],

    // Objects
    [[{ a: 2 }, { a: 1 }], true],
    [[{ a: 1 }, { a: 2 }], false],
    [[{ a: 1 }, { a: 1 }], true],

    // Field references
    [["$a", "$b"], true, { obj: { a: 10, b: 10 } }],
    [["$a", "$b"], true, { obj: { a: 20, b: 10 } }],
    [["$a", "$b"], false, { obj: { a: 10, b: 20 } }],
    [["$a", 10], true, { obj: { a: 10 } }],
    [["$a", 10], true, { obj: { a: 11 } }],
    [["$a", 10], false, { obj: { a: 9 } }]
  ],

  $lt: [
    // Numbers
    [[1, 2], true],
    [[2, 1], false],
    [[1, 1], false],
    [[-1, 0], true],
    [[0, -1], false],
    [[1, 1.1], true],
    [[1.1, 1], false],
    [[-2, -1], true],

    // Strings
    [["a", "b"], true],
    [["b", "a"], false],
    [["a", "a"], false],
    [["Hello", "hello"], true],
    [["hello", "Hello"], false],
    [["", "a"], true],
    [["a", ""], false],

    // Booleans
    [[false, true], true],
    [[true, false], false],
    [[true, true], false],
    [[false, false], false],

    // Null
    [[null, null], false],
    [[null, 1], true],
    [[1, null], false],

    // Arrays
    [[[1], [2]], true],
    [[[2], [1]], false],
    [
      [
        [1, 1],
        [1, 2]
      ],
      true
    ],
    [
      [
        [1, 2],
        [1, 1]
      ],
      false
    ],
    [[[], []], false],
    [[[], [1]], true],
    [[[1], []], false],

    // Objects
    [[{ a: 1 }, { a: 2 }], true],
    [[{ a: 2 }, { a: 1 }], false],

    // Field references
    [["$a", "$b"], true, { obj: { a: 10, b: 20 } }],
    [["$a", "$b"], false, { obj: { a: 20, b: 10 } }],
    [["$a", 10], true, { obj: { a: 9 } }],
    [["$a", 10], false, { obj: { a: 10 } }],
    [["$a", 10], false, { obj: { a: 11 } }]
  ],

  $lte: [
    // Numbers
    [[1, 2], true],
    [[2, 1], false],
    [[1, 1], true],
    [[-1, 0], true],
    [[0, -1], false],
    [[1, 1.1], true],
    [[1.1, 1], false],
    [[-1, -1], true],

    // Strings
    [["a", "b"], true],
    [["b", "a"], false],
    [["a", "a"], true],
    [["Hello", "hello"], true],
    [["hello", "Hello"], false],
    [["", "a"], true],
    [["", ""], true],

    // Booleans
    [[false, true], true],
    [[true, false], false],
    [[true, true], true],
    [[false, false], true],

    // Null
    [[null, null], true],
    [[null, 1], true],
    [[1, null], false],

    // Arrays
    [[[1], [2]], true],
    [[[2], [1]], false],
    [[[1], [1]], true],
    [
      [
        [1, 1],
        [1, 2]
      ],
      true
    ],
    [[[], []], true],
    [[[], [1]], true],
    [[[1], []], false],

    // Objects
    [[{ a: 1 }, { a: 2 }], true],
    [[{ a: 2 }, { a: 1 }], false],
    [[{ a: 1 }, { a: 1 }], true],

    // Field references
    [["$a", "$b"], true, { obj: { a: 10, b: 10 } }],
    [["$a", "$b"], true, { obj: { a: 10, b: 20 } }],
    [["$a", "$b"], false, { obj: { a: 20, b: 10 } }],
    [["$a", 10], true, { obj: { a: 10 } }],
    [["$a", 10], true, { obj: { a: 9 } }],
    [["$a", 10], false, { obj: { a: 11 } }]
  ],

  $cmp: [
    // Numbers
    [[1, 1], 0],
    [[1, 2], -1],
    [[2, 1], 1],
    [[0, 0], 0],
    [[-1, 1], -1],
    [[1, -1], 1],
    [[-2, -1], -1],
    [[-1, -2], 1],
    [[1, 1.0], 0],
    [[1.5, 1], 1],
    [[1, 1.5], -1],

    // Strings
    [["a", "a"], 0],
    [["a", "b"], -1],
    [["b", "a"], 1],
    [["", ""], 0],
    [["", "a"], -1],
    [["a", ""], 1],
    [["Hello", "hello"], -1],
    [["hello", "Hello"], 1],

    // Booleans
    [[true, true], 0],
    [[false, false], 0],
    [[false, true], -1],
    [[true, false], 1],

    // Null
    [[null, null], 0],
    [[null, 1], -1],
    [[1, null], 1],

    // Arrays
    [[[], []], 0],
    [[[1], [1]], 0],
    [[[1], [2]], -1],
    [[[2], [1]], 1],
    [
      [
        [1, 2],
        [1, 3]
      ],
      -1
    ],
    [
      [
        [1, 3],
        [1, 2]
      ],
      1
    ],
    [[[1], [1, 2]], -1],
    [[[1, 2], [1]], 1],

    // Objects
    [[{}, {}], 0],
    [[{ a: 1 }, { a: 1 }], 0],
    [[{ a: 1 }, { a: 2 }], -1],
    [[{ a: 2 }, { a: 1 }], 1],

    // Field references
    [["$a", "$b"], 0, { obj: { a: 10, b: 10 } }],
    [["$a", "$b"], -1, { obj: { a: 10, b: 20 } }],
    [["$a", "$b"], 1, { obj: { a: 20, b: 10 } }],
    [["$a", 10], 0, { obj: { a: 10 } }],
    [["$a", 10], -1, { obj: { a: 9 } }],
    [["$a", 10], 1, { obj: { a: 11 } }]
  ]
});
