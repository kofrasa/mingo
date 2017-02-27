var test = require('tape')
var Mingo = require('../mingo')

test('Arithmetic Operators', function (t) {
  t.plan(5)

  var sales = [
    {
      '_id': 1,
      'item': 'abc',
      'price': 10,
      'fee': 2,
      'discount': 5,
      'quantity': 2,
      date: new Date('2014-03-01T08:00:00Z')
    },
    {
      '_id': 2,
      'item': 'jkl',
      'price': 20,
      'fee': 1,
      'discount': 2,
      'quantity': 1,
      date: new Date('2014-03-01T09:00:00Z')
    },
    {
      '_id': 3,
      'item': 'xyz',
      'price': 5,
      'fee': 0,
      'discount': 1,
      'quantity': 10,
      date: new Date('2014-03-15T09:00:00Z')
    }
  ]

  // $add
  var result = Mingo.aggregate(sales, [
    {$project: {item: 1, total: {$add: ['$price', '$fee']}}}
  ])
  t.deepEqual(result, [
    {'_id': 1, 'item': 'abc', 'total': 12},
    {'_id': 2, 'item': 'jkl', 'total': 21},
    {'_id': 3, 'item': 'xyz', 'total': 5}
  ], 'aggregate with $add operator')

  // $subtract
  result = Mingo.aggregate(sales, [
    {$project: {item: 1, total: {$subtract: [{$add: ['$price', '$fee']}, '$discount']}}}
  ])
  t.deepEqual(result, [
    {'_id': 1, 'item': 'abc', 'total': 7},
    {'_id': 2, 'item': 'jkl', 'total': 19},
    {'_id': 3, 'item': 'xyz', 'total': 4}
  ], 'aggregate with $subtract operator')

  // $multiply
  result = Mingo.aggregate(sales, [
    {$project: {date: 1, item: 1, total: {$multiply: ['$price', '$quantity']}}}
  ])
  t.deepEqual(result, [
    {'_id': 1, 'item': 'abc', 'date': new Date('2014-03-01T08:00:00Z'), 'total': 20},
    {'_id': 2, 'item': 'jkl', 'date': new Date('2014-03-01T09:00:00Z'), 'total': 20},
    {'_id': 3, 'item': 'xyz', 'date': new Date('2014-03-15T09:00:00Z'), 'total': 50}
  ], 'aggregate with $multiply operator')

  // $divide
  result = Mingo.aggregate([
    {'_id': 1, 'name': 'A', 'hours': 80, 'resources': 7},
    {'_id': 2, 'name': 'B', 'hours': 40, 'resources': 4}
  ], [
    {$project: {name: 1, workdays: {$divide: ['$hours', 8]}}}
  ])
  t.deepEqual(result, [
    {'_id': 1, 'name': 'A', 'workdays': 10},
    {'_id': 2, 'name': 'B', 'workdays': 5}
  ], 'aggregate with $divide operator')

  // $mod
  result = Mingo.aggregate([
    {'_id': 1, 'project': 'A', 'hours': 80, 'tasks': 7},
    {'_id': 2, 'project': 'B', 'hours': 40, 'tasks': 4}
  ], [
    {$project: {remainder: {$mod: ['$hours', '$tasks']}}}
  ])
  t.deepEqual(result, [
    {'_id': 1, 'remainder': 3},
    {'_id': 2, 'remainder': 0}
  ], 'aggregate with $mod operator')

  t.end()
})
