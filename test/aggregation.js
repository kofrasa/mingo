/**
 * Created with JetBrains PhpStorm.
 * User: francis
 * Date: 10/28/13
 * Time: 11:49 AM
 */

isReady.then(function () {

  module("Aggregation Framework");

  var students = testData['students'];

  test("$match operator", function () {
    var result = Mingo.aggregate(students, {'$match': {_id: {$in: [0,1,2,3,4]}}});
    ok(result.length === 5, "can filter collection with $match");
  });

  test("$unwind operator", function () {
    var flattened = Mingo.aggregate(students, {'$unwind': '$scores'});
    ok(flattened.length === 800, "can unwind array value in collection");
  });

  test("$project operator", function () {
    var result = Mingo.aggregate(
      students,
      {'$unwind': '$scores'},
      {'$project': {'name': 1, 'type': '$scores.type', 'score': {$add: ["$scores.score", 10]}}}
    );

    var fields = _.keys(result[0]);
    ok(fields.length === 3, "can project fields with $project");
    ok(_.contains(fields, 'type'), "can rename fields with $project");
  });

  test("$group operator", function () {
    var flattened = Mingo.aggregate(students, {'$unwind': '$scores'});
    var grouped = Mingo.aggregate(
      flattened,
      {'$group': {'_id': '$scores.type', 'highest': {$max: '$scores.score'},
        'lowest': {$min: '$scores.score'}, 'average': {$avg: '$scores.score'}, 'count': {$sum: 1}}}
    );
    ok(grouped.length === 3, "can group collection with $group");
  });

  test("$limit operator", function () {
    var result = Mingo.aggregate(students, {'$limit': 100});
    ok(result.length === 100, "can limit result with $limit");
  });

  test("$skip operator", function () {
    var result = Mingo.aggregate(students, {'$skip': 100});
    ok(result.length === students.length - 100, "can skip result with $skip");
  });

  test("$sort operator", function () {
    var result = Mingo.aggregate(students, {'$sort': {'_id': -1}});
    ok(result[0]['_id'] === 199, "can sort collection with $sort");
  });

});