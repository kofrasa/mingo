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

  test("Match $all with $elemMatch on nested elements", function () {

    var data = [{
      user: { username: 'User1', projects: [{ name: "Project 1", rating: { complexity: 6 }}, { name: "Project 2", rating: { complexity: 2 }}] }
    },{
      user: { username: 'User2', projects: [{ name: "Project 1", rating: { complexity: 6 }}, { name: "Project 2", rating: { complexity: 8 }}] }
    }];
    var query = {
      'user.projects': {
        "$all": [{
          "$elemMatch": {
            'rating.complexity': { '$gt' : 6 }
          }
        }]
      }
    };
    // It should return one user object
    var result = Mingo.find(data, query).count();
    ok(result === 1, "can match using $all with $elemMatch on nested elements");

  });

});