import * as samples from "../../support";

samples.runTestPipeline("$match pipeline operator", [
  {
    message: "can filter collection with $match",
    input: samples.studentsData,
    pipeline: [
      { $match: { _id: { $in: [0, 1, 2, 3, 4] } } },
      { $count: "size" },
    ],
    expected: [{ size: 5 }],
  },
]);
