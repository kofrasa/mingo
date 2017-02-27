var test = require('tape')
var Mingo = require('../mingo')

test('Conditional Operators', function (t) {
  t.plan(4)

  var products = [
    {'_id': 1, 'item': 'abc1', description: 'product 1', qty: 400},
    {'_id': 2, 'item': 'abc2', description: 'product 2', qty: 200},
    {'_id': 3, 'item': 'xyz1', description: 'product 3', qty: 150},
    {'_id': 4, 'item': 'VWZ1', description: 'product 4', qty: 300},
    {'_id': 5, 'item': 'VWZ2', description: 'product 5', qty: 80}
  ]

  var result = Mingo.aggregate(products, [{
    $project: {
      item: 1,
      stock: {
        $cond: {
          if: {$lte: ['$qty', 200]},
          then: 'low',
          else: 'high'
        }
      }
    }
  }])

  t.deepEqual([
    {'_id': 1, 'item': 'abc1', 'stock': 'high'},
    {'_id': 2, 'item': 'abc2', 'stock': 'low'},
    {'_id': 3, 'item': 'xyz1', 'stock': 'low'},
    {'_id': 4, 'item': 'VWZ1', 'stock': 'high'},
    {'_id': 5, 'item': 'VWZ2', 'stock': 'low'}
  ], result, 'can apply $cond aggregate operator')

  result = Mingo.aggregate(products, [{
    $project: {
      item: 1,
      stock: {
        $switch: {
          branches: [
            {case: {$lte: ['$qty', 200]}, then: 'low'},
            {case: {$gte: ['$qty', 400]}, then: 'high'}
          ],
          default: 'normal'
        }
      }
    }
  }])

  t.deepEqual([
    {'_id': 1, 'item': 'abc1', 'stock': 'high'},
    {'_id': 2, 'item': 'abc2', 'stock': 'low'},
    {'_id': 3, 'item': 'xyz1', 'stock': 'low'},
    {'_id': 4, 'item': 'VWZ1', 'stock': 'normal'},
    {'_id': 5, 'item': 'VWZ2', 'stock': 'low'}
  ], result, 'can apply $switch aggregate operator')

  result = Mingo.aggregate([
    {'_id': 1, 'item': 'abc1', description: 'product 1', qty: 300},
    {'_id': 2, 'item': 'abc2', description: null, qty: 200},
    {'_id': 3, 'item': 'xyz1', qty: 250}
  ], [{
    $project: {
      item: 1,
      description: {$ifNull: [ '$description', 'Unspecified' ]}
    }
  }])

  t.deepEqual([
    {'_id': 1, 'item': 'abc1', 'description': 'product 1'},
    {'_id': 2, 'item': 'abc2', 'description': 'Unspecified'},
    {'_id': 3, 'item': 'xyz1', 'description': 'Unspecified'}
  ], result, 'can apply $ifNull aggregate operator')

  // expect $ifNull to throw if num of args are wrong
  t.throws(function () {
    Mingo.aggregate([
      {'_id': 1, 'item': 'abc1', description: 'product 1', qty: 300}
    ], [{
      $project: {
        item: 1,
        description: {$ifNull: [ '$description', 'Unspecified', '' ]}
      }
    }])
  }, /Invalid arguments for \$ifNull operator/,
  '$ifNull throws with wrong arguments')

  t.end()
})
