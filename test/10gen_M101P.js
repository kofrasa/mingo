/**
 * Created with JetBrains PhpStorm.
 * User: francis
 * Date: 10/23/13
 * Time: 3:38 PM
 */


isReady.then(function () {

  module("10gen Education: M101P");

  test("Homework 2.1", function () {
    var grades = new SimpleGrades();
    var cursor = grades.query({
      type: "exam",
      score: {$gte: 65}
    });
    var student = cursor.sort({'score': 1}).limit(1).first();
    equal(student.student_id, 22, "Student ID with lowest exam score is 22");

  });

  test("Homework 2.2", function () {
    var grades = new SimpleGrades();
    var lowest = grades.aggregate(
      {'$match': { "type": "homework"}},
      {'$group':{'_id':'$student_id', 'score':{$min:'$score'}}},
      {'$sort':{'_id': 1, 'score': 1}}
    );

    var homework = grades.query({type: 'homework'}).sort({'student_id': 1, 'score': 1}).all();
    var ids = [];
    var sid = null;
    for (var i = 0, j = 0; i < homework.length; i++) {
      if (homework[i]['student_id'] !== sid) {
        ids.push(homework[i]['_id']);
        sid = homework[i]['student_id'];
      }
    }

    equal(ids.length, 200, "200 minimum homework scores found");
    var result = Mingo.remove(grades.toJSON(), {'_id': {$in: ids}});
    equal(result.length, 600, "remove lowest homework from grades for each student. count is 600");

    //var res = Mingo.find(result).sort({'score':-1}).skip(100).limit(1).first();
    //console.log(res);
    // Mingo.find(result, {}, {'student_id':1, 'type':1, 'score':1, '_id':0}).sort({'student_id':1, 'score':1}).limit(5);

    var res = Mingo.aggregate(result, {'$group':{'_id':'$student_id', 'average':{$avg:'$score'}}}, {'$sort':{'average':-1}}, {'$limit':1});
    equal(res[0]['_id'], 54, "student with highest average has id 54");
  });

});