/**
 * Created with JetBrains PhpStorm.
 * User: francis
 * Date: 9/27/13
 * Time: 2:31 PM
 */

isReady.then(function () {

  module("Collections");

  test("Cursor operations", function () {
    var data = testData['grades_simple'];
    // create a query with no criteria
    var query = new Mingo.Query();
    var cursor = query.find(data);
    ok(cursor.hasNext(), "can peek for an item");
    ok(cursor.next(), "can select next item");
    ok(_.isObject(cursor.first()), "can retrieve first item");
    ok(_.isObject(cursor.last()), "can retrieve last item");
    equal(cursor.count(), 800, "can count items");

  });

  test("Backbone integration", function () {
    var grades = new MingoCollection(testData['grades_simple']);
    // find students with grades less than 50 in homework or quiz
    // sort by score ascending and type descending
    var cursor = grades.query({
      $or: [
        {type: "quiz", score: {$lt: 50}},
        {type: "homework", score: {$lt: 50}}
      ]
    }, {student_id: 1}).sort({score: 1});

    ok(cursor.count() < 800, "can query Backbone collection");
  });

  test("pipeline operators", function () {
    var students = testData['students'];

    var flattened = Mingo.aggregate(students, {'$unwind': '$scores'});
    ok(flattened.length === 800, "can flatten collection with $unwind");

    var result = Mingo.aggregate(flattened, {'$match': {_id: 0}});
    ok(result.length === 4, "can filter collection with $match");

    // find highest and lowest scores for each type
    var grouped = Mingo.aggregate(
      flattened,
      {'$group': {'_id': '$scores.type', 'highest': {$max: '$scores.score'},
        'lowest': {$min: '$scores.score'}, 'average': {$avg: '$scores.score'}, 'count': {$sum: 1}}}
    );
    ok(grouped.length === 3, "can group collection with $group");

  });

  test("$group operators", function () {
    // generate some sample data
    var sample = [];
    for (var i = 0; i < 10; i++) {
      sample.push({
        '_id': i,
        'class': ['A','B'][_.random(1)],
        'score': i + 10
      })
    }

    result = Mingo.aggregate(
      sample,
      {'$group': {'_id': 'stats', 'max': {$max: '$score'},
        'min': {$min: '$score'}, 'avg': {$avg: '$score'}, 'count': {$sum: 1},
        'classes': {$push: '$class'}, 'set': {$addToSet: '$class'},
        'first': {$first: '$score'}, 'last': {$last: '$score'}
      }}
    );

    // average := 14.5, max := 19, min: 10, count: 10
    equal(result[0]['max'], 19, "can apply $max in grouping");
    equal(result[0]['min'], 10, "can apply $min in grouping");
    equal(result[0]['avg'], 14.5, "can apply $avg in grouping");
    equal(result[0]['count'], 10, "can apply $sum in grouping");
    ok(result[0]['first'] === 10, "can apply $first in grouping");
    ok(result[0]['last'] === 19, "can apply $last in grouping");

    var val = result[0]['classes'];
    ok(val.length == 10 && (_.contains(val, 'A') || _.contains(val, 'B')), "can apply $push in grouping");

    val = result[0]['set'];
    ok(val.length === 2 && (_.contains(val, 'A') && _.contains(val, 'B')), "can apply $addToSet in grouping");
  });

});