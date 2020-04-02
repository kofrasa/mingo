import test from 'tape'
import mingo from '../../lib'

test('Variable Operators', function (t) {
  let result = mingo.aggregate([
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

  t.end()
})
