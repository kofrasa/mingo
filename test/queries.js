/**
 * Created with JetBrains PhpStorm.
 * User: francis
 * Date: 9/25/13
 * Time: 1:21 PM
 */


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
  },
  grades: [
    { grade: 92, mean: 88, std: 8 },
    { grade: 78, mean: 90, std: 5 },
    { grade: 88, mean: 85, std: 3 }
  ]
};

test("Simple comparisons", function () {
  var queries = [
    [{firstName: "Francis"}, "can check for equality"],,
    [{lastName: /^a.+e/i}, "can check against regex with literal"],
    [{lastName: {$regex: "a.+e", $options: "i"}}, "can check against regex with $regex operator"],
    [{username: {$not: "mufasa"}}, "can apply $not to direct values"],
    [{username: {$not: { $ne: "kofrasa"}}}, "can apply $not to sub queries"],
    [{jobs: {$gt: 1, $gte: 6, $lte: 6, $lt: 10}}, "can compare with $gt, $gte, $lt, $lte"],
    [{middlename: {$exists: false}}, "can check if value does not exists with $exists"],
    [{projects: {$exists: true}}, "can check if value exists with $exits"],
    [{"projects.C.1": "student_record" }, "can compare value inside array at a given index"],
    [{"circles.school": {$in: ["Henry"]}}, "can check that value is in array with $in"],
    [{"circles.family": {$nin: ["Pamela"]}}, "can check that value is not in array with $nin"],
    [{"languages.programming": {$size: 7 }}, "can determine size of nested array with $size"],
    [{"projects.Python": "Flaskapp"}, "can match nested elements in array"],
    [{"date.month": {$mod: [8, 1]}}, "can find modulo of values with $mod"],
    [{"languages.spoken": {$not: {$all: ["english", "french"]}}}, "can check that all values exists in array with $all"],
    [{date: {year: 2013, month: 9, day: 25}}, "can match field with object values"],
    [{"grades.0.grade": 92}, "can match fields for objects in a given position in an array"],
    [{"grades.mean": { $gt: 70 }}, "can match fields for all objects within an array"]
  ];

  _.each(queries, function (q) {
    ok(Mingo.compile(q[0]).test(obj), q[1]);
  });
});


test("Conjunctions", function () {
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
      ok(Mingo.compile(q[0]).test(obj), q[1]);
    } else if (q.length === 3) {
      equal(Mingo.compile(q[0]).test(obj), q[1], q[2]);
    }
  });
});