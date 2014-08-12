var test = require('tape'),
  fs = require('fs'),
  _ = require('underscore'),
  JSON = require('JSON'),
  Mingo = require('../mingo');


var students = JSON.parse(fs.readFileSync(__dirname + '/data/students.json'));
var gradesSimple = JSON.parse(fs.readFileSync(__dirname + '/data/grades_simple.json'));


test("Aggregation Pipeline Operators", function (t) {

    t.test("$match operator", function (t) {
      t.plan(1);
      var result = Mingo.aggregate(students, [
        {'$match': {_id: {$in: [0, 1, 2, 3, 4]}}}
      ]);
      t.ok(result.length === 5, "can filter collection with $match");
    });

    t.test("$unwind operator", function (t) {
      t.plan(1)
      var flattened = Mingo.aggregate(students, [
        {'$unwind': '$scores'}
      ]);
      t.ok(flattened.length === 800, "can unwind array value in collection");
    });

    t.test("$project operator", function (t) {
      t.plan(7);
      var result = Mingo.aggregate(
        students,
        [
          {'$unwind': '$scores'},
          {'$project': {
            'name': 1,
            'type': '$scores.type',
            'details': {
              "plus10": {$add: ["$scores.score", 10] }
            }
          }},
          { '$limit': 1}
        ]
      );

      var fields = _.keys(result[0]);
      t.ok(fields.length === 4, "can project fields with $project");
      t.ok(_.contains(fields, 'type'), "can rename fields with $project");
      var temp = result[0]['details'];
      t.ok(_.isObject(temp) && _.keys(temp).length === 1, "can create and populate sub-documents");

      var school = [
        {
          _id: 1,
          zipcode: 63109,
          students: [
            { name: "john", school: 102, age: 10 },
            { name: "jess", school: 102, age: 11 },
            { name: "jeff", school: 108, age: 15 }
          ]
        },
        {
          _id: 2,
          zipcode: 63110,
          students: [
            { name: "ajax", school: 100, age: 7 },
            { name: "achilles", school: 100, age: 8 }
          ]
        },

        {
          _id: 3,
          zipcode: 63109,
          students: [
            { name: "ajax", school: 100, age: 7 },
            { name: "achilles", school: 100, age: 8 }
          ]
        },

        {
          _id: 4,
          zipcode: 63109,
          students: [
            { name: "barney", school: 102, age: 7 }
          ]
        }
      ];

      result = Mingo.find(
        school,
        { zipcode: 63109 },
        {students: { $elemMatch: { school: 102 } }}
      ).all();

      t.ok(result.length === 3 && !_.has(result[1], 'students'), "can project with $elemMatch operator");

      result = Mingo.find(
        school,
        {},
        {students: { $slice: -1 }}
      ).first();

      var matched = result.students.length === 1;
      matched = matched && result.students[0]['name'] === 'jeff';
      t.ok(matched, "can slice projected array elements with $slice");

      // examples from mongoDB website

      var products = [
        { "_id" : 1, "item" : "abc1", description: "product 1", qty: 300 },
        { "_id" : 2, "item" : "abc2", description: "product 2", qty: 200 },
        { "_id" : 3, "item" : "xyz1", description: "product 3", qty: 250 },
        { "_id" : 4, "item" : "VWZ1", description: "product 4", qty: 300 },
        { "_id" : 5, "item" : "VWZ2", description: "product 5", qty: 180 }
      ];

      result = Mingo.aggregate(products, [
        {
          $project:
          {
            item: 1,
            qty: 1,
            qtyEq250: { $eq: [ "$qty", 250 ] },
            _id: 0
          }
        }
      ]);
      t.deepEqual(result, [
        { "item" : "abc1", "qty" : 300, "qtyEq250" : false },
        { "item" : "abc2", "qty" : 200, "qtyEq250" : false },
        { "item" : "xyz1", "qty" : 250, "qtyEq250" : true },
        { "item" : "VWZ1", "qty" : 300, "qtyEq250" : false },
        { "item" : "VWZ2", "qty" : 180, "qtyEq250" : false }
      ], "can project with $eq operator");

      // $cmp
      result = Mingo.aggregate(products, [
        {
          $project:
          {
            item: 1,
            qty: 1,
            cmpTo250: { $cmp: [ "$qty", 250 ] },
            _id: 0
          }
        }]);
      t.deepEqual(result, [
        { "item" : "abc1", "qty" : 300, "cmpTo250" : 1 },
        { "item" : "abc2", "qty" : 200, "cmpTo250" : -1 },
        { "item" : "xyz1", "qty" : 250, "cmpTo250" : 0 },
        { "item" : "VWZ1", "qty" : 300, "cmpTo250" : 1 },
        { "item" : "VWZ2", "qty" : 180, "cmpTo250" : -1 }
      ], "can project with $cmp operator");

    });

//  test("$ positional operator", function () {
//    var result = Mingo.find([
//      { "_id": 7, semester: 3, "grades": [
//        { grade: 80, mean: 75, std: 8 },
//        { grade: 85, mean: 90, std: 5 },
//        { grade: 90, mean: 85, std: 3 }
//      ] },
//
//      { "_id": 8, semester: 3, "grades": [
//        { grade: 92, mean: 88, std: 8 },
//        { grade: 78, mean: 90, std: 5 },
//        { grade: 88, mean: 85, std: 3 }
//      ] }
//    ],
//      { "grades.mean": { $gt: 80 } },
//      { "grades.$": 1 }
//    ).all();
//    console.log(result);
//    ok(result[0]['grades'].length == 1, "can apply $ positional operator");
//  });

    t.test("$group operator", function (t) {
      t.plan(1);
      var flattened = Mingo.aggregate(students, [
        {'$unwind': '$scores'}
      ]);
      var grouped = Mingo.aggregate(
        flattened,
        [
          {'$group': {'_id': '$scores.type', 'highest': {$max: '$scores.score'},
            'lowest': {$min: '$scores.score'}, 'average': {$avg: '$scores.score'}, 'count': {$sum: 1}}}
        ]
      );
      t.ok(grouped.length === 3, "can group collection with $group");
    });

    t.test("$limit operator", function (t) {
      t.plan(1);
      var result = Mingo.aggregate(students, [
        {'$limit': 100}
      ]);
      t.ok(result.length === 100, "can limit result with $limit");
    });

    t.test("$skip operator", function (t) {
      t.plan(1);
      var result = Mingo.aggregate(students, [
        {'$skip': 100}
      ]);
      t.ok(result.length === students.length - 100, "can skip result with $skip");
    });

    t.test("$sort operator", function (t) {
      t.plan(1);
      var result = Mingo.aggregate(students, [
        {'$sort': {'_id': -1}}
      ]);
      t.ok(result[0]['_id'] === 199, "can sort collection with $sort");
    });
});

test("Arithmetic Aggregation Operators", function (t) {
  t.plan(4);

  var sales = [
    { "_id" : 1, "item" : "abc", "price" : 10, "fee" : 2, "discount" : 5, "quantity": 2, date: new Date("2014-03-01T08:00:00Z") },
    { "_id" : 2, "item" : "jkl", "price" : 20, "fee" : 1, "discount" : 2, "quantity": 1, date: new Date("2014-03-01T09:00:00Z") },
    { "_id" : 3, "item" : "xyz", "price" : 5,  "fee" : 0, "discount" : 1, "quantity": 10, date: new Date("2014-03-15T09:00:00Z") }
  ];

  // $add
  var result = Mingo.aggregate(sales, [
    { $project: { item: 1, total: { $add: [ "$price", "$fee" ] } } }
  ]);
  t.deepEqual(result, [
    { "_id" : 1, "item" : "abc", "total" : 12 },
    { "_id" : 2, "item" : "jkl", "total" : 21 },
    { "_id" : 3, "item" : "xyz", "total" : 5 }
  ], "aggregate with $add operator");

  // $subtract
  result = Mingo.aggregate(sales, [
    { $project: { item: 1, total: { $subtract: [ { $add: [ "$price", "$fee" ] }, "$discount" ] } } }
  ]);
  t.deepEqual(result, [
    { "_id" : 1, "item" : "abc", "total" : 7 },
    { "_id" : 2, "item" : "jkl", "total" : 19 },
    { "_id" : 3, "item" : "xyz", "total" : 4 }
  ], "aggregate with $subtract operator");

  // $multiply
  result = Mingo.aggregate(sales, [
    { $project: { date: 1, item: 1, total: { $multiply: [ "$price", "$quantity" ] } } }
  ]);
  t.deepEqual(result, [
    { "_id" : 1, "item" : "abc", "date" : new Date("2014-03-01T08:00:00Z"), "total" : 20 },
    { "_id" : 2, "item" : "jkl", "date" : new Date("2014-03-01T09:00:00Z"), "total" : 20 },
    { "_id" : 3, "item" : "xyz", "date" : new Date("2014-03-15T09:00:00Z"), "total" : 50 }
  ], "aggregate with $multiply operator");

  // $divide
  result = Mingo.aggregate([
    { "_id" : 1, "name" : "A", "hours" : 80, "resources" : 7 },
    { "_id" : 2, "name" : "B", "hours" : 40, "resources" : 4 }
  ], [
    { $project: { name: 1, workdays: { $divide: [ "$hours", 8 ] } } }
  ]);
  t.deepEqual(result, [
    { "_id" : 1, "name" : "A", "workdays" : 10 },
    { "_id" : 2, "name" : "B", "workdays" : 5 }
  ], "aggregate with $divide operator");

  t.end();

});

test("Aggregation String Operators", function (t) {
  t.test("$toUpper operator", function (t) {
    t.plan(1);
    var result = Mingo.aggregate(students,
      [
        { $project: { name: 1, caption: {$toUpper: "$name"} } },
        { $sort: { name: 1 } },
        { $limit: 3}
      ]
    );
    t.ok(result[1]['name'].toUpperCase() === result[1]['caption'], "aggregate with $toUpper operator");
  });

  t.test("$toLower operator", function (t) {
    t.plan(1);
    var result = Mingo.aggregate(students,
      [
        { $project: { name: 1, caption: {$toLower: "$name"} } },
        { $sort: { name: 1 } },
        { $limit: 3}
      ]
    );
    t.ok(result[1]['name'].toLowerCase() === result[1]['caption'], "aggregate with $toLowerCase operator");
  });

  t.test("$substr operator", function (t) {
    t.plan(1);
    var result = Mingo.aggregate(gradesSimple,
      [
        { $project: { hash: {$substr: ["$_id.$oid", 0, 8]} } },
        { $limit: 1}
      ]
    );
    var hash = result[0]['_id']['$oid'].substr(0, 8);
    t.ok(result[0]['hash'] == hash, "aggregate with $substr operator");
  });
});