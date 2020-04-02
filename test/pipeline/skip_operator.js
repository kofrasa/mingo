import test from 'tape'
import * as mingo from '../../lib'
import * as samples from '../support'

test("$skip pipeline operator", function (t) {
  t.plan(1);
  let result = mingo.aggregate(samples.studentsData, [
    { '$skip': 100 }
  ]);
  t.ok(result.length === samples.studentsData.length - 100, "can skip result with $skip");
});