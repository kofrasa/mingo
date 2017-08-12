var test = require('tape')
var mingo = require('../../dist/mingo')
var samples = require('../support')
var _ = mingo._internal()

test("$match pipeline operator", function (t) {
  t.plan(1);
  var result = mingo.aggregate(samples.studentsData, [
    { '$match': { _id: { $in: [0, 1, 2, 3, 4] } } }
  ]);
  t.ok(result.length === 5, "can filter collection with $match");
});