/**
 * Created with JetBrains PhpStorm.
 * User: francis
 * Date: 9/27/13
 * Time: 2:31 PM
 */

isReady.then(function () {

  module("Collections");

  test("Array of objects", function () {
    var students = testData['students'];

    var semester = [
      { "_id" : 7, semester: 3, "grades" : [ { grade: 80, mean: 75, std: 8 },
        { grade: 85, mean: 90, std: 5 },
        { grade: 90, mean: 85, std: 3 } ] },

      { "_id" : 8, semester: 3, "grades" : [ { grade: 92, mean: 88, std: 8 },
        { grade: 78, mean: 90, std: 5 },
        { grade: 88, mean: 85, std: 3 } ] },

      { "_id" : 8, semester: 3, "grades" : [ { grade: 92, mean: 70, std: 8 },
        { grade: 78, mean: 60, std: 5 },
        { grade: 88, mean: 40, std: 3 } ] }
    ];

    var result = Mingo.find(
      semester,
      {"grades.mean": { $gt: 70 }}
    ).all();

    ok(result.length === 2, "can match elements in array");

  });

  test("Cursor operations", function () {
    var data = testData['grades_simple'];
    // create a query with no criteria
    var query = new Mingo.Query();
    var cursor = query.find(data);
    ok(cursor.hasNext(), "can peek for an item with hasNext()");
    ok(cursor.next(), "can select next item with next()");
    ok(_.isObject(cursor.first()), "can retrieve first item with first()");
    ok(_.isObject(cursor.last()), "can retrieve last item with last()");
    ok(cursor.count() === 800, "can count items with count()");

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

});