var test = require('tape')
var mingo = require('../../dist/mingo')
var samples = require('../samples')
var _ = mingo._internal()


test("$unwind pipeline operator", function (t) {
  t.plan(1)
  var flattened = mingo.aggregate(samples.studentsData, [
    { '$unwind': '$scores' }
  ]);
  t.ok(flattened.length === 800, "can unwind array value in collection");
});