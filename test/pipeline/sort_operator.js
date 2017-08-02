var test = require('tape')
var mingo = require('../../dist/mingo')
var samples = require('../samples')
var _ = mingo._internal()

test("$sort pipeline operator", function (t) {
  t.plan(2);
  var result = mingo.aggregate(samples.studentsData, [
    { '$sort': { '_id': -1 } }
  ]);
  t.ok(result[0]['_id'] === 199, "can sort collection with $sort");

  var data = [
    { _id: 'c', date: new Date(2018, 1, 1) },
    { _id: 'a', date: new Date(2017, 1, 1) },
    { _id: 'b', date: new Date(2017, 1, 1) }
  ];
  var expected = [
    { _id: 'a', date: new Date(2017, 1, 1) },
    { _id: 'b', date: new Date(2017, 1, 1) },
    { _id: 'c', date: new Date(2018, 1, 1) },
  ]

  result = mingo.aggregate(data, [{ "$sort": { "date": 1 } }]);
  t.deepEqual(result, expected, "can sort on complex fields");
});