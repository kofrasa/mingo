import test from "tape";

import { aggregate } from "../../src";
import * as samples from "../support";

test("$limit pipeline operator", (t) => {
  t.plan(1);
  const result = aggregate(samples.studentsData, [{ $limit: 20 }]);
  t.ok(
    result.length === 20 && samples.studentsData.length > 20,
    "can apply $limit"
  );
});
