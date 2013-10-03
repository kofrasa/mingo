/**
 * Created with JetBrains PhpStorm.
 * User: francis
 * Date: 9/27/13
 * Time: 2:31 PM
 */
/**
 * Created with JetBrains PhpStorm.
 * User: francis
 * Date: 9/25/13
 * Time: 1:21 PM
 */


$(document).ready(function () {

  module("Collections");

  var testData = {
    'grades_simple': null,
    'grades_complex': null,
    'students': null
  };

  var deferred = $.Deferred();
  deferred.resolve();

  // preload data
  _.each(_.keys(testData), function (file) {
    deferred = deferred.then(function () {
      return $.getJSON('data/' + file + ".json", function (data) {
        testData[file] = data;
      });
    });
  });

  deferred.then(function () {

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

  }).then(function () {

    test("Backbone integration", function () {
      // using with Backbone
      var Grades = Backbone.Collection.extend(Mingo.CollectionMixin);
      var grades = new Grades(testData['grades_simple']);
      // find students with grades less than 50 in homework or quiz
      // sort by score ascending and type descending
      var cursor = grades.query({
        $or: [{type: "quiz", score: {$lt: 50}}, {type: "homework", score: {$lt: 50}}]
      }, {student_id:1}).sort({score: 1});

      ok(cursor.count() < 800, "can query Backbone collection");
    });

  }).then(function () {
      test("Aggregation - $project", function () {

        var grades = testData['grades_simple'];
        var cursor = Mingo.find(grades, {
          score: {$gte: 50}
        }, {type: 1, score: 1}).sort({score: 1});

        var obj = cursor.first();
        ok(_.has(obj, "type", "_id") && !_.has(obj, "student_id"), "can project fields");
        ok(cursor.count() < grades.length);

      });
    });

});