var test = require('tape')
var Backbone = require('backbone')
var mingo = require('../dist/mingo')
var samples = require('./samples')
var _ = mingo._internal()

test('CollectionMixin integration', function (t) {
  t.plan(1)

  var MingoCollection = Backbone.Collection.extend(mingo.CollectionMixin)
  var grades = new MingoCollection(samples.simpleGradesData)
  // find students with grades less than 50 in homework or quiz
  // sort by score ascending and type descending
  var cursor = grades.query({
    $or: [
      {type: 'quiz', score: {$lt: 50}},
      {type: 'homework', score: {$lt: 50}}
    ]
  }, {student_id: 1}).sort({score: 1})

  t.ok(cursor.count() < 800, 'can query Backbone collection')
})
