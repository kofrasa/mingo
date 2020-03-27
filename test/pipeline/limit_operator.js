var test = require('tape')
var mingo = require('../../es5')
var samples = require('../support')


test("$limit pipeline operator", function (t) {
  t.plan(1);
  var result = mingo.aggregate(samples.studentsData, [
    { '$limit': 20 }
  ]);
  t.ok(result.length === 20 && samples.studentsData.length > 20, "can apply $limit");
});