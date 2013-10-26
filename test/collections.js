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
      $or: [{type: "quiz", score: {$lt: 50}}, {type: "homework", score: {$lt: 50}}]
    }, {student_id:1}).sort({score: 1});

    ok(cursor.count() < 800, "can query Backbone collection");
  });

  test("Aggregation", function () {
    var students = testData['students'];
    var result = Mingo.aggregate(
      students,
      {'$unwind': '$scores'},
      {'$match': {_id: 0}}
    );

    ok(result.length > 1, "can flatten array values with $unwind");
    equal(result.length, 4, "can filter collection with $match");

//    result = Mingo.aggregate(
//      students,
//      {'$unwind': '$scores'},
//      {'$match': {_id: 0}},
//      {'$group': {'_id': '$scores.type', 'scores': '$scores.score'}}
//    );
//
//    console.log(result);
//    equal(result, 3, "can group by field with $group");

  });

});