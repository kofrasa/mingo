import * as samples from "../support";

samples.runTestPipeline("$match pipeline operator", [
  {
    input: samples.studentsData,
    query: [{ $match: { _id: { $in: [0, 1, 2, 3, 4] } } }],
    check: (result, t) => {
      t.ok(result.length === 5, "can filter collection with $match");
    },
  },
]);
