var test = require('tape')
var mingo = require('../../dist/mingo')
var samples = require('../samples')
var _ = mingo._internal()


test("$limit pipeline operator", function (t) {
  t.plan(1);
  var result = mingo.aggregate(samples.studentsData, [
    { '$limit': 20 }
  ]);
  t.ok(result.length === 20 && samples.studentsData.length > 20, "can apply $limit");
});