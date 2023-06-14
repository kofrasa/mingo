import { aggregate } from "../../../src";
import { ProcessingMode } from "../../../src/core";
import { DEFAULT_OPTS, runTestPipeline, studentsData } from "../../support";

// english
const english = [
  { name: "Bob" },
  { name: "Tom" },
  { name: "alice" },
  { name: "peggy" },
  { name: "21" },
  { name: "100" }
];

const french = [
  { name: "a" },
  { name: "B" },
  { name: "b" },
  { name: "c" },
  { name: "á" },
  { name: "A" }
];

describe("operators/pipeline/sort", () => {
  it("can sort collection with $sort", () => {
    const result = aggregate(
      studentsData,
      [{ $sort: { _id: -1 } }, { $limit: 1 }, { $project: { _id: 1 } }],
      DEFAULT_OPTS
    );
    expect(result).toStrictEqual([{ _id: 199 }]);
  });

  it("can sort on complex fields", () => {
    const result = aggregate(
      [
        { _id: "c", date: new Date(2018, 1, 1) },
        { _id: "a", date: new Date(2017, 1, 1) },
        { _id: "b", date: new Date(2017, 1, 1) }
      ],
      [{ $sort: { date: 1 } }],
      DEFAULT_OPTS
    );
    expect(result).toStrictEqual([
      { _id: "a", date: new Date(2017, 1, 1) },
      { _id: "b", date: new Date(2017, 1, 1) },
      { _id: "c", date: new Date(2018, 1, 1) }
    ]);
  });

  it("can sort with collation", () => {
    const result = aggregate(
      [
        { _id: 1, name: "A" },
        { _id: 2, name: "B" },
        { _id: 3, name: "c" },
        { _id: 4, name: "a" }
      ],
      [{ $sort: { name: 1 } }],
      {
        ...DEFAULT_OPTS,
        collation: {
          locale: "en",
          strength: 1
        }
      }
    );

    expect(result).toStrictEqual([
      { _id: 1, name: "A" },
      { _id: 4, name: "a" },
      { _id: 2, name: "B" },
      { _id: 3, name: "c" }
    ]);
  });

  it("can sort with locale", () => {
    const result = aggregate(english, [{ $sort: { name: 1 } }], {
      ...DEFAULT_OPTS,
      collation: {
        locale: "en"
      },
      processingMode: ProcessingMode.CLONE_INPUT
    });
    expect(result).toStrictEqual([
      { name: "100" },
      { name: "21" },
      { name: "alice" },
      { name: "Bob" },
      { name: "peggy" },
      { name: "Tom" }
    ]);
  });

  it("can sort with numeric odering", () => {
    const result = aggregate(english, [{ $sort: { name: 1 } }], {
      ...DEFAULT_OPTS,
      collation: {
        locale: "en",
        numericOrdering: true
      },
      processingMode: ProcessingMode.CLONE_INPUT
    });

    expect(result).toStrictEqual([
      { name: "21" },
      { name: "100" },
      { name: "alice" },
      { name: "Bob" },
      { name: "peggy" },
      { name: "Tom" }
    ]);
  });
});

runTestPipeline("$sort", [
  {
    message: "can sort with accented letters",
    input: french,
    pipeline: [{ $sort: { name: 1 } }],
    options: {
      collation: {
        locale: "fr"
      }
    },
    expected: [
      { name: "a" },
      { name: "A" },
      { name: "á" },
      { name: "b" },
      { name: "B" },
      { name: "c" }
    ]
  },

  {
    message: "can sort upper case letters before lower case",
    input: french,
    pipeline: [{ $sort: { name: 1 } }],
    options: {
      collation: {
        locale: "fr",
        caseFirst: "upper"
      }
    },
    expected: [
      { name: "A" },
      { name: "a" },
      { name: "á" },
      { name: "B" },
      { name: "b" },
      { name: "c" }
    ]
  },

  {
    message: "sort should consider only base differences",
    input: french,
    pipeline: [{ $sort: { name: 1 } }],
    options: {
      collation: {
        locale: "fr",
        strength: 1
      }
    },
    expected: [
      { name: "a" },
      { name: "á" },
      { name: "A" },
      { name: "B" },
      { name: "b" },
      { name: "c" }
    ]
  },

  {
    message: "can sort accented letters",
    input: french,
    pipeline: [{ $sort: { name: 1 } }],
    options: {
      collation: {
        locale: "fr",
        strength: 2
      }
    },
    expected: [
      { name: "a" },
      { name: "A" },
      { name: "á" },
      { name: "B" },
      { name: "b" },
      { name: "c" }
    ]
  },

  {
    message: "can sort letters reversed",
    input: [
      { name: "Ánfora" },
      { name: "Óscar" },
      { name: "Barça" },
      { name: "Niño" },
      { name: "¡Hola!" },
      { name: "¿qué?" }
    ],
    pipeline: [{ $sort: { name: -1 } }],
    options: {
      collation: {
        locale: "es"
      }
    },
    expected: [
      { name: "Óscar" },
      { name: "Niño" },
      { name: "Barça" },
      { name: "Ánfora" },
      { name: "¿qué?" },
      { name: "¡Hola!" }
    ]
  },

  {
    message: "can sort letters ignoring punctuations",
    input: [
      { name: "Hello there" },
      { name: "Hello,there" },
      { name: "Hello  there" },
      { name: "Hello,there" }
    ],
    pipeline: [{ $sort: { name: 1 } }],
    options: {
      collation: {
        locale: "en",
        alternate: "shifted"
      }
    },
    expected: [
      { name: "Hello there" },
      { name: "Hello,there" },
      { name: "Hello,there" },
      { name: "Hello  there" }
    ]
  },

  {
    message: "should sort by nested field. Fixes #332.",
    input: [
      { state: { start: new Date("2022-09-12T22:00:00.000Z"), foo: 111 } },
      { state: { start: new Date("2022-09-12T22:00:00.001Z"), foo: 222 } },
      { state: { start: new Date("2022-09-12T22:00:00.002Z"), foo: 333 } }
    ],
    pipeline: [{ $sort: { "state.start": 1 } }],
    expected: [
      { state: { start: new Date("2022-09-12T22:00:00.000Z"), foo: 111 } },
      { state: { start: new Date("2022-09-12T22:00:00.001Z"), foo: 222 } },
      { state: { start: new Date("2022-09-12T22:00:00.002Z"), foo: 333 } }
    ]
  }
]);
