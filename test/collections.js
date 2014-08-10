var test = require('tape'),
  fs = require('fs'),
  _ = require('underscore'),
  JSON = require('JSON'),
  Backbone = require('backbone'),
  Mingo = require('../mingo');


var gradesSimple = JSON.parse(fs.readFileSync(__dirname + '/data/grades_simple.json'));
var gradesComplex = JSON.parse(fs.readFileSync(__dirname + '/data/grades_complex.json'));
var MingoCollection =  Backbone.Collection.extend(Mingo.CollectionMixin);

test('Collections', function (t) {

  t.test("Cursor operations", function (t) {
    t.plan(5);
    // create a query with no criteria
    var query = new Mingo.Query();
    var cursor = query.find(gradesSimple);
    t.ok(cursor.hasNext(), "can peek for an item with hasNext()");
    t.ok(cursor.next(), "can select next item with next()");
    t.ok(_.isObject(cursor.first()), "can retrieve first item with first()");
    t.ok(_.isObject(cursor.last()), "can retrieve last item with last()");
    t.ok(cursor.count() === 800, "can count items with count()");
  });

  t.test("Backbone integration", function (t) {
    t.plan(1);
    var grades = new MingoCollection(gradesSimple);
    // find students with grades less than 50 in homework or quiz
    // sort by score ascending and type descending
    var cursor = grades.query({
      $or: [
        {type: "quiz", score: {$lt: 50}},
        {type: "homework", score: {$lt: 50}}
      ]
    }, {student_id: 1}).sort({score: 1});

    t.ok(cursor.count() < 800, "can query Backbone collection");
  });

  t.test("Match $all with $elemMatch on nested elements", function (t) {
    t.plan(1);

    var data = [
      {
        user: { username: 'User1', projects: [
          { name: "Project 1", rating: { complexity: 6 }},
          { name: "Project 2", rating: { complexity: 2 }}
        ] }
      },
      {
        user: { username: 'User2', projects: [
          { name: "Project 1", rating: { complexity: 6 }},
          { name: "Project 2", rating: { complexity: 8 }}
        ] }
      }
    ];
    var criteria = {
      'user.projects': {
        "$all": [
          {
            "$elemMatch": {
              'rating.complexity': { '$gt': 6 }
            }
          }
        ]
      }
    };
    // It should return one user object
    var result = Mingo.find(data, criteria).count();
    t.ok(result === 1, "can match using $all with $elemMatch on nested elements");

  });
});


test("JSON Stream filtering", function (t) {
  t.plan(2);

  var fs = require('fs'),
    Transform = require('stream').Transform,
    util = require('util'),
    Mingo = require('../mingo');

  // create a simple JSON stream
  var JSONStream = function () {
    if (!(this instanceof JSONStream))
      return new JSONStream();
    Transform.call(this, {objectMode: true});
  };
  util.inherits(JSONStream, Transform);
  JSONStream.prototype._transform = function (chunk, enc, done) {
    var self = this;
    chunk = JSON.parse(chunk);
    _.each(chunk, function (obj) {
      self.push(obj);
    });
    done();
  };

  var found2Keys = true;
  var cursor;
  var query = new Mingo.Query({
    scores: { $elemMatch: {type: "exam", score: {$gt: 90}} }
  }, {name: 1});

  var file = fs.createReadStream(__dirname + '/data/students.json');
  file.on('data', function (data) {
    cursor = query.find(JSON.parse(data));
  });

  var qs = query.stream();
  var count = 0;
  qs.on('data', function (data) {
    // projecting only {name, _id}
    found2Keys = _.keys(data).length == 2 && found2Keys;
    count++;
  });

  qs.on('end', function () {
    t.ok(count > 0 && count === cursor.count(), "Filtered only matching documents via stream");
    t.ok(found2Keys, "Projected only requested keys via stream");
  });

  // fileStream --> jsonStream --> queryStream
  file.pipe(JSONStream()).pipe(qs);

});