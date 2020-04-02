import test from 'tape'
import * as mingo from '../../lib'
import * as samples from '../support'


test("$limit pipeline operator", function (t) {
  t.plan(1);
  let result = mingo.aggregate(samples.studentsData, [
    { '$limit': 20 }
  ]);
  t.ok(result.length === 20 && samples.studentsData.length > 20, "can apply $limit");
});