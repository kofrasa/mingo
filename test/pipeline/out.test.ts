import { AnyVal, Collection } from "../../src/types";
import * as samples from "../support";

const output: Collection = [];
const result = [
  { _id: "Dante", books: ["The Banquet", "Divine Comedy", "Eclogues"] },
  { _id: "Homer", books: ["The Odyssey", "Iliad"] },
];

samples.runTestPipeline("pipeline/out", [
  {
    message: "can apply $out operator",
    pipeline: [
      { $group: { _id: "$author", books: { $push: "$title" } } },
      { $out: "out" },
    ],
    options: {
      collectionResolver: (_: string) => output,
    },
    input: [
      { _id: 8751, title: "The Banquet", author: "Dante", copies: 2 },
      { _id: 8752, title: "Divine Comedy", author: "Dante", copies: 1 },
      { _id: 8645, title: "Eclogues", author: "Dante", copies: 2 },
      { _id: 7000, title: "The Odyssey", author: "Homer", copies: 10 },
      { _id: 7020, title: "Iliad", author: "Homer", copies: 10 },
    ],
    expected: (actual: AnyVal) => {
      expect(actual).toEqual(result);
      expect(output).toEqual(result);
    },
  },
]);
