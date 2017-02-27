var test = require('tape')
var Mingo = require('../mingo')

test('Literal Operators', function (t) {
  t.plan(1)
  var result = Mingo.aggregate([
    {'_id': 1, 'item': 'abc123', price: '$2.50'},
    {'_id': 2, 'item': 'xyz123', price: '1'},
    {'_id': 3, 'item': 'ijk123', price: '$1'}
  ], [{
    $project: { costsOneDollar: { $eq: ['$price', { $literal: '$1' }] } }
  }])

  t.deepEqual([
    {'_id': 1, 'costsOneDollar': false},
    {'_id': 2, 'costsOneDollar': false},
    {'_id': 3, 'costsOneDollar': true}
  ], result, 'can apply $literal operator')

  t.end()
})
