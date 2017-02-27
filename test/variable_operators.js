var test = require('tape')
var Mingo = require('../mingo')

test('Variable Operators', function (t) {
  t.plan(2)
  var result = Mingo.aggregate([
    {_id: 1, price: 10, tax: 0.50, applyDiscount: true},
    {_id: 2, price: 10, tax: 0.25, applyDiscount: false}
  ], [
    {
      $project: {
        finalTotal: {
          $let: {
            vars: {
              total: {$add: ['$price', '$tax']},
              discounted: {$cond: {if: '$applyDiscount', then: 0.9, else: 1}}
            },
            in: {$multiply: ['$$total', '$$discounted']}
          }
        }
      }
    }
  ])

  t.ok(
    result[0].finalTotal === 9.450000000000001 && result[1].finalTotal === 10.25,
    'can apply $let operator'
  )

  result = Mingo.aggregate([
    {_id: 1, quizzes: [5, 6, 7]},
    {_id: 2, quizzes: []},
    {_id: 3, quizzes: [3, 8, 9]}
  ], [
    {
      $project: {
        adjustedGrades: {
          $map: {
            input: '$quizzes',
            as: 'grade',
            in: {$add: ['$$grade', 2]}
          }
        }
      }
    }
  ])

  t.deepEqual([
    {'_id': 1, 'adjustedGrades': [7, 8, 9]},
    {'_id': 2, 'adjustedGrades': []},
    {'_id': 3, 'adjustedGrades': [5, 10, 11]}
  ], result, 'can apply $map operator')

  t.end()
})
