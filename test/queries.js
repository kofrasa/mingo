/**
 * Created with JetBrains PhpStorm.
 * User: francis
 * Date: 9/25/13
 * Time: 1:21 PM
 */


$(document).ready(function () {

  module("Queries");

  var obj = {
    firstName: "Francis",
    lastName: "Asante",
    username: "kofrasa",
    title: "Software Engineer",
    degree: "Computer Science",
    jobs: 6,
    date: {
      year: 2013,
      month: 9,
      day: 25
    },
    languages: {
      spoken: ["english"],
      programming: ["C", "Python", "Scala", "Java", "Javascript", "Bash", "C#"]
    },
    circles: {
      school: ["Kobby", "Henry", "Kanba", "Nana", "Albert", "Yayra", "Linda", "Sophia"],
      work: ["Kobby", "KT", "Evans", "Robert", "Ehi", "Ebo", "KO"],
      family: ["Richard", "Roseline", "Michael", "Rachel"]
    },
    projects: {
      "C": ["word_grid", "student_record", "calendar"],
      "Java": ["Easy Programming Language", "SurveyMobile"],
      "Python": ["Kasade", "Code Jam", "Flaskapp", "FlaskUtils"],
      "Scala": [],
      "Javascript": ["mingo", "Backapp", "BackboneApp", "Google Election Maps"]
    }
  };

  test("simple comparisons", function () {
    var queries = [
      [{firstName: "Francis"}, "can check for equality"],,
      [{lastName: /^a.+e/i}, "can check against regex"],
      [{username: {$not: "mufasa"}}, "can apply $not to direct values"],
      [{username: {$not: { $ne: "kofrasa"}}}, "can apply $not to sub queries"],
      [{jobs: {$gt: 1, $gte: 6, $lte: 6, $lt: 10}}, "can compare with >, >=, <, <="],
      [{middlename: {$exists: false}}, "can check if value does not exists"],
      [{projects: {$exists: true}}, "can check if value exists"],
      [{"projects.C.1": "student_record" }, "can compare value inside array at index"],
      [{"circles.school": {$in: ["Henry"]}}, "can check that value is in array"],
      [{"circles.family": {$nin: ["Pamela"]}}, "can check that value is not in array"],
      [{"languages.programming": {$size: 7 }}, "can determine size of array"],
      [{"date.month": {$mod: [8, 1]}}, "can check modulo of values"],
      [{"languages.spoken": {$not: {$all: ["english", "french"]}}}, "can check that all values exists in array"]
    ];

    _.each(queries, function (q) {
      ok(mingo.compile(q[0]).test(obj), q[1]);
    });
  });


  test("conjunctions", function () {
    var queries = [
      [{$and: [{firstName: "Francis"},{lastName: /^a.+e/i}]}, "can use conjunction true AND true"],
      [{$and: [{firstName: "Francis"},{lastName: "Amoah"}]}, false, "can use conjunction true AND false"],
      [{$and: [{firstName: "Enoch"},{lastName: "Asante"}]}, false, "can use conjunction false AND true"],
      [{$and: [{firstName: "Enoch"},{age: {$exists: true}}]}, false, "can use conjunction false AND false"],
      // or
      [{$or: [{firstName: "Francis"},{lastName: /^a.+e/i}]}, "can use conjunction true OR true"],
      [{$or: [{firstName: "Francis"},{lastName: "Amoah"}]}, "can use conjunction true OR false"],
      [{$or: [{firstName: "Enoch"},{lastName: "Asante"}]}, "can use conjunction false OR true"],
      [{$or: [{firstName: "Enoch"},{age: {$exists: true}}]}, false, "can use conjunction false OR false"],
      // nor
      [{$nor: [{firstName: "Francis"},{lastName: /^a.+e/i}]}, false, "can use conjunction true NOR true"],
      [{$nor: [{firstName: "Francis"},{lastName: "Amoah"}]}, false, "can use conjunction true NOR false"],
      [{$nor: [{firstName: "Enoch"},{lastName: "Asante"}]}, false, "can use conjunction false NOR true"],
      [{$nor: [{firstName: "Enoch"},{age: {$exists: true}}]}, "can use conjunction false NOR false"]
    ];

    _.each(queries, function (q) {
      if (q.length === 2) {
        ok(mingo.compile(q[0]).test(obj), q[1]);
      } else if (q.length === 3) {
        equal(mingo.compile(q[0]).test(obj), q[1], q[2]);
      }
    });
  });

});