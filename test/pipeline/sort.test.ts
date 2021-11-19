import * as samples from "../support";

// english
const english = [
  { name: "Bob" },
  { name: "Tom" },
  { name: "alice" },
  { name: "peggy" },
  { name: "21" },
  { name: "100" },
];

const french = [
  { name: "a" },
  { name: "B" },
  { name: "b" },
  { name: "c" },
  { name: "á" },
  { name: "A" },
];

samples.runTestPipeline("pipeline/replaceRoot", [
  {
    message: "can sort collection with $sort",
    input: samples.studentsData,
    pipeline: [{ $sort: { _id: -1 } }, { $limit: 1 }, { $project: { _id: 1 } }],
    expected: [{ _id: 199 }],
  },

  {
    message: "can sort on complex fields",
    input: [
      { _id: "c", date: new Date(2018, 1, 1) },
      { _id: "a", date: new Date(2017, 1, 1) },
      { _id: "b", date: new Date(2017, 1, 1) },
    ],
    pipeline: [{ $sort: { date: 1 } }],
    expected: [
      { _id: "a", date: new Date(2017, 1, 1) },
      { _id: "b", date: new Date(2017, 1, 1) },
      { _id: "c", date: new Date(2018, 1, 1) },
    ],
  },

  {
    message: "can sort with collation",
    input: [
      { _id: 1, name: "A" },
      { _id: 2, name: "B" },
      { _id: 3, name: "c" },
      { _id: 4, name: "a" },
    ],
    pipeline: [{ $sort: { name: 1 } }],
    options: {
      collation: {
        locale: "en",
        strength: 1,
      },
    },
    expected: [
      { _id: 1, name: "A" },
      { _id: 4, name: "a" },
      { _id: 2, name: "B" },
      { _id: 3, name: "c" },
    ],
  },

  {
    message: "can sort with locale",
    input: english,
    pipeline: [{ $sort: { name: 1 } }],
    options: {
      collation: {
        locale: "en",
      },
    },
    expected: [
      { name: "100" },
      { name: "21" },
      { name: "alice" },
      { name: "Bob" },
      { name: "peggy" },
      { name: "Tom" },
    ],
  },

  {
    message: "can sort with numeric odering",
    input: english,
    pipeline: [{ $sort: { name: 1 } }],
    options: {
      collation: {
        locale: "en",
        numericOrdering: true,
      },
    },
    expected: [
      { name: "21" },
      { name: "100" },
      { name: "alice" },
      { name: "Bob" },
      { name: "peggy" },
      { name: "Tom" },
    ],
  },

  {
    message: "can sort with accented letters",
    input: french,
    pipeline: [{ $sort: { name: 1 } }],
    options: {
      collation: {
        locale: "fr",
      },
    },
    expected: [
      { name: "a" },
      { name: "A" },
      { name: "á" },
      { name: "b" },
      { name: "B" },
      { name: "c" },
    ],
  },

  {
    message: "can sort upper case letters before lower case",
    input: french,
    pipeline: [{ $sort: { name: 1 } }],
    options: {
      collation: {
        locale: "fr",
        caseFirst: "upper",
      },
    },
    expected: [
      { name: "A" },
      { name: "a" },
      { name: "á" },
      { name: "B" },
      { name: "b" },
      { name: "c" },
    ],
  },

  {
    message: "sort should consider only base differences",
    input: french,
    pipeline: [{ $sort: { name: 1 } }],
    options: {
      collation: {
        locale: "fr",
        strength: 1,
      },
    },
    expected: [
      { name: "a" },
      { name: "á" },
      { name: "A" },
      { name: "B" },
      { name: "b" },
      { name: "c" },
    ],
  },

  {
    message: "can sort accented letters",
    input: french,
    pipeline: [{ $sort: { name: 1 } }],
    options: {
      collation: {
        locale: "fr",
        strength: 2,
      },
    },
    expected: [
      { name: "a" },
      { name: "A" },
      { name: "á" },
      { name: "B" },
      { name: "b" },
      { name: "c" },
    ],
  },

  {
    message: "can sort letters reversed",
    input: [
      { name: "Ánfora" },
      { name: "Óscar" },
      { name: "Barça" },
      { name: "Niño" },
      { name: "¡Hola!" },
      { name: "¿qué?" },
    ],
    pipeline: [{ $sort: { name: -1 } }],
    options: {
      collation: {
        locale: "es",
      },
    },
    expected: [
      { name: "Óscar" },
      { name: "Niño" },
      { name: "Barça" },
      { name: "Ánfora" },
      { name: "¿qué?" },
      { name: "¡Hola!" },
    ],
  },

  {
    message: "can sort letters ignoring punctuations",
    input: [
      { name: "Hello there" },
      { name: "Hello,there" },
      { name: "Hello  there" },
      { name: "Hello,there" },
    ],
    pipeline: [{ $sort: { name: 1 } }],
    options: {
      collation: {
        locale: "en",
        alternate: "shifted",
      },
    },
    expected: [
      { name: "Hello there" },
      { name: "Hello,there" },
      { name: "Hello,there" },
      { name: "Hello  there" },
    ],
  },
]);
