import test from "tape";

import { aggregate } from "../../src";
import * as samples from "../support";

test("$skip pipeline operator", (t) => {
  t.plan(1);
  const result = aggregate(samples.studentsData, [{ $skip: 100 }]);
  t.ok(
    result.length === samples.studentsData.length - 100,
    "can skip result with $skip"
  );
});
