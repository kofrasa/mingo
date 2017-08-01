var test = require('tape')
var Backbone = require('backbone')
var mingo = require('../dist/mingo')
var samples = require('./samples')
var _ = mingo._internal()

test('Mingo.Cursor', function (t) {
  t.plan(5)
  // create a query with no criteria
  var query = new mingo.Query()
  var cursor = query.find(samples.gradesSimple)
  t.ok(cursor.hasNext(), 'can peek for an item with hasNext()')
  t.ok(cursor.next(), 'can select next item with next()')
  t.ok(_.isObject(cursor.first()), 'can retrieve first item with first()')
  t.ok(_.isObject(cursor.last()), 'can retrieve last item with last()')
  t.ok(cursor.count() === 800, 'can count items with count()')
})

test('CollectionMixin integration', function (t) {
  t.plan(1)

  var MingoCollection = Backbone.Collection.extend(mingo.CollectionMixin)
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
  var result = mingo.find(data, criteria).count()
  t.ok(result === 1, 'can match using $all with $elemMatch on nested elements')
})

test('Evaluate $where last', function (t) {
  t.plan(2)

  var data = [
    {
      user: {
        username: 'User1',
        projects: [
          {name: 'Project 1', rating: {complexity: 6}},
          {name: 'Project 2', rating: {complexity: 2}}
        ],
        color: 'green',
        number: 42
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
    'user.color': {$exists: true},
    'user.number': {$exists: true},
    $where: 'this.user.color === "green" && this.user.number === 42'
  }
  // It should return one user object
  var result = mingo.find(data, criteria).count()
  t.ok(result === 1, 'can safely reference properties on this using $where and $exists')

  criteria = {
    'user.color': {$exists: true},
    'user.number': {$exists: true},
    $and: [
      { $where: 'this.user.color === "green"' },
      { $where: 'this.user.number === 42' }
    ]
  }
  // It should return one user object
  var result = mingo.find(data, criteria).count()
  t.ok(result === 1, 'can safely reference properties on this using multiple $where operators and $exists')
})
