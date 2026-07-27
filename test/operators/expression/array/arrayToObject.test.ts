import { runTest, testPath } from "../../../support";

runTest(testPath(import.meta.url), {
  $arrayToObject: [
    // nil input
    [null, null],
    ["not array", Error("array of key-value pairs")],
    ["not array", null, { failOnError: false }],
    // invalid input
    [[1, 2, 3], Error("array of key-value pairs")],
    [
      [
        ["a", 1],
        ["b", 2]
      ],
      { a: 1, b: 2 }
    ],
    [
      [
        { k: "a", v: 1 },
        { k: "b", v: 2 }
      ],
      { a: 1, b: 2 }
    ],
    // non uniform input objects
    [[{ k: "a", v: 1 }, ["b", 2]], Error("array of {k,v}")],
    [[{ k: "a", v: 1 }, ["b", 2]], null, { failOnError: false }],
    // non uniform input arrays
    [[["b", 2], { k: "a", v: 1 }], Error("array of [k,v]")],
    [[["b", 2], { k: "a", v: 1 }], null, { failOnError: false }],
    [
      {
        $arrayToObject: {
          $literal: [
            { k: "item", v: "abc123" },
            { k: "qty", v: 25 }
          ]
        }
      },
      { item: "abc123", qty: 25 }
    ],
    [
      {
        $arrayToObject: {
          $literal: [
            ["item", "abc123"],
            ["qty", 25]
          ]
        }
      },
      { item: "abc123", qty: 25 }
    ]
  ]
});
