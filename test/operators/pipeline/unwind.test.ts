import * as samples from "../../support";

const data = [
  { _id: 1, item: "ABC", sizes: ["S", "M", "L"] },
  { _id: 2, item: "EFG", sizes: [] },
  { _id: 3, item: "IJK", sizes: "M" },
  { _id: 4, item: "LMN" },
  { _id: 5, item: "XYZ", sizes: null },
];

samples.runTestPipeline("operators/pipeline/unwind", [
  {
    message: "can unwind array value in collection",
    input: samples.studentsData,
    pipeline: [{ $unwind: "$scores" }, { $count: "size" }],
    expected: { size: 800 },
  },

  {
    message: "can $unwind with field selector",
    input: data,
    pipeline: [{ $unwind: "$sizes" }],
    expected: [
      { _id: 1, item: "ABC", sizes: "S" },
      { _id: 1, item: "ABC", sizes: "M" },
      { _id: 1, item: "ABC", sizes: "L" },
      { _id: 3, item: "IJK", sizes: "M" },
    ],
  },

  {
    message: "can $unwind with object expression",
    input: data,
    pipeline: [{ $unwind: { path: "$sizes" } }],
    expected: [
      { _id: 1, item: "ABC", sizes: "S" },
      { _id: 1, item: "ABC", sizes: "M" },
      { _id: 1, item: "ABC", sizes: "L" },
      { _id: 3, item: "IJK", sizes: "M" },
    ],
  },

  {
    message: 'can $unwind with option "includeArrayIndex"',
    input: data,
    pipeline: [
      { $unwind: { path: "$sizes", includeArrayIndex: "arrayIndex" } },
    ],
    expected: [
      { _id: 1, item: "ABC", sizes: "S", arrayIndex: 0 },
      { _id: 1, item: "ABC", sizes: "M", arrayIndex: 1 },
      { _id: 1, item: "ABC", sizes: "L", arrayIndex: 2 },
      { _id: 3, item: "IJK", sizes: "M", arrayIndex: null },
    ],
  },

  {
    message: 'can $unwind with option "preserveNullAndEmptyArrays"',
    input: data,
    pipeline: [
      { $unwind: { path: "$sizes", preserveNullAndEmptyArrays: true } },
    ],
    expected: [
      { _id: 1, item: "ABC", sizes: "S" },
      { _id: 1, item: "ABC", sizes: "M" },
      { _id: 1, item: "ABC", sizes: "L" },
      { _id: 2, item: "EFG" },
      { _id: 3, item: "IJK", sizes: "M" },
      { _id: 4, item: "LMN" },
      { _id: 5, item: "XYZ", sizes: null },
    ],
  },

  {
    //https://github.com/kofrasa/mingo/issues/80
    message: "$unwind array nested within object",
    input: [
      { _id: 1, item: "ABC", a: { sizes: ["S", "M", "L"] } },
      { _id: 2, item: "EFG", a: { sizes: [] } },
      { _id: 3, item: "IJK", a: { sizes: "M" } },
      { _id: 4, item: "LMN", a: {} },
      { _id: 5, item: "XYZ", a: { sizes: null } },
    ],
    pipeline: [{ $unwind: "$a.sizes" }],
    expected: [
      { _id: 1, item: "ABC", a: { sizes: "S" } },
      { _id: 1, item: "ABC", a: { sizes: "M" } },
      { _id: 1, item: "ABC", a: { sizes: "L" } },
      { _id: 3, item: "IJK", a: { sizes: "M" } },
    ],
  },

  {
    message: "$unwind has 0 value item",
    input: [
      { _id: 1, number: 0 },
      { _id: 2, number: 1 },
    ],
    pipeline: [{ $unwind: "$number" }],
    expected: [
      { _id: 1, number: 0 },
      { _id: 2, number: 1 },
    ],
  },
]);
