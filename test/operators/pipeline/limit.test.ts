import { RawArray } from "../../../src/types";
import * as samples from "../../support";

samples.runTestPipeline("operators/pipeline/limit", [
  {
    message: "can apply $limit",
    input: samples.studentsData,
    pipeline: [{ $limit: 20 }],
    expected: (actual: RawArray) => {
      expect(actual.length).toEqual(20);
    },
  },
]);
