var test = require('tape')
var mingo = require('../../dist/mingo')
var samples = require('../support')
var _ = mingo._internal()

test("$project pipeline operator", function (t) {
  t.plan(13);
  var result = mingo.aggregate(
    samples.studentsData,
    [
      { '$unwind': '$scores' },
      {
        '$project': {
          'name': 1,
          'type': '$scores.type',
          'details': {
            "plus10": { $add: ["$scores.score", 10] }
          }
        }
      },
      { '$limit': 1 }
    ]
  );

  var fields = Object.keys(result[0]);
  t.equal(fields.length, 4, "can project fields with $project");
  t.ok(_.includes(fields, 'type'), "can rename fields with $project");
  var temp = result[0]['details'];
  t.ok(_.isObject(temp) && Object.keys(temp).length === 1, "can create and populate sub-documents");

  // examples from mongoDB website

  var products = [
    { "_id": 1, "item": "abc1", description: "product 1", qty: 300 },
    { "_id": 2, "item": "abc2", description: "product 2", qty: 200 },
    { "_id": 3, "item": "xyz1", description: "product 3", qty: 250 },
    { "_id": 4, "item": "VWZ1", description: "product 4", qty: 300 },
    { "_id": 5, "item": "VWZ2", description: "product 5", qty: 180 }
  ];

  result = mingo.aggregate(products, [
    {
      $project: {
        item: 1,
        qty: 1,
        qtyEq250: { $eq: ["$qty", 250] },
        _id: 0
      }
    }
  ]);
  t.deepEqual(result, [
    { "item": "abc1", "qty": 300, "qtyEq250": false },
    { "item": "abc2", "qty": 200, "qtyEq250": false },
    { "item": "xyz1", "qty": 250, "qtyEq250": true },
    { "item": "VWZ1", "qty": 300, "qtyEq250": false },
    { "item": "VWZ2", "qty": 180, "qtyEq250": false }
  ], "can project with $eq operator");

  // $cmp
  result = mingo.aggregate(products, [
    {
      $project: {
        item: 1,
        qty: 1,
        cmpTo250: { $cmp: ["$qty", 250] },
        _id: 0
      }
    }]);
  t.deepEqual(result, [
    { "item": "abc1", "qty": 300, "cmpTo250": 1 },
    { "item": "abc2", "qty": 200, "cmpTo250": -1 },
    { "item": "xyz1", "qty": 250, "cmpTo250": 0 },
    { "item": "VWZ1", "qty": 300, "cmpTo250": 1 },
    { "item": "VWZ2", "qty": 180, "cmpTo250": -1 }
  ], "can project with $cmp operator");

  result = mingo.aggregate(
    samples.studentsData,
    [
      {
        '$project': {
          'name': 0
        }
      },
      { '$limit': 1 }
    ]
  );

  fields = Object.keys(result[0]);
  t.ok(fields.length === 2, "2/3 fields are included. Instead: " + fields.length);
  t.ok(fields.indexOf('name') === -1, "name is excluded");
  t.ok(fields.indexOf('_id') >= 0, "_id is included");
  t.ok(fields.indexOf('scores') >= 0, "score is included");

  result = mingo.aggregate(
    samples.studentsData,
    [
      {
        '$project': {
          '_id': 0
        }
      },
      { '$limit': 1 }
    ]
  );

  fields = Object.keys(result[0]);
  t.ok(fields.length === 2, "2/3 fields are included. Instead: " + fields.length);
  t.ok(fields.indexOf('name') >= 0, "name is included");
  t.ok(fields.indexOf('_id') === -1, "_id is excluded");
  t.ok(fields.indexOf('scores') >= 0, "score is included");
});