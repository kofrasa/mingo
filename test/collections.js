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
    var grades = new SimpleGrades();
    // find students with grades less than 50 in homework or quiz
    // sort by score ascending and type descending
    var cursor = grades.query({
      $or: [{type: "quiz", score: {$lt: 50}}, {type: "homework", score: {$lt: 50}}]
    }, {student_id:1}).sort({score: 1});

    ok(cursor.count() < 800, "can query Backbone collection");
  });

  test("Aggregation Pipeline", function () {
    var grades = new SimpleGrades();
    var result = grades.aggregate(
      {'$group':{'_id':'$student_id', 'average':{$avg:'$score'}}},
      {'$sort':{'average':-1}}, {'$limit':1}
    );
    var val = result[0];

    equal(val["_id"], 164, "can $group with aggregation");
    equal(Math.round(val["average"] * 100) / 100, 89.3, "can $sort with aggregation");
    equal(result.length, 1, "can $limit with aggregation");

  });

});