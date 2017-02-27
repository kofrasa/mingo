var test = require('tape')
var Backbone = require('backbone')
var Mingo = require('../mingo')
var samples = require('./samples')
var _ = Mingo._internal()

test('Mingo.Cursor', function (t) {
  t.plan(5)
  // create a query with no criteria
  var query = new Mingo.Query()
  var cursor = query.find(samples.gradesSimple)
  t.ok(cursor.hasNext(), 'can peek for an item with hasNext()')
  t.ok(cursor.next(), 'can select next item with next()')
  t.ok(_.isObject(cursor.first()), 'can retrieve first item with first()')
  t.ok(_.isObject(cursor.last()), 'can retrieve last item with last()')
  t.ok(cursor.count() === 800, 'can count items with count()')
})

test('CollectionMixin integration', function (t) {
  t.plan(1)

  var MingoCollection = Backbone.Collection.extend(Mingo.CollectionMixin)
  var grades = new MingoCollection(samples.gradesSimple)
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

test('Match $all with $elemMatch on nested elements', function (t) {
  t.plan(1)

  var data = [
    {
      user: {
        username: 'User1',
        projects: [
          {name: 'Project 1', rating: {complexity: 6}},
          {name: 'Project 2', rating: {complexity: 2}}
        ]
      }
    },
    {
      user: {
        username: 'User2',
        projects: [
          {name: 'Project 1', rating: {complexity: 6}},
          {name: 'Project 2', rating: {complexity: 8}}
        ]
      }
    }
  ]
  var criteria = {
    'user.projects': {'$all': [ {'$elemMatch': {'rating.complexity': {'$gt': 6}}} ]}
  }
  // It should return one user object
  var result = Mingo.find(data, criteria).count()
  t.ok(result === 1, 'can match using $all with $elemMatch on nested elements')
})
