var test = require('tape')
var Mingo = require('../mingo')
var tryExamples = require('./samples').tryExamples

test('String Operators', function (t) {
  var inventory = [
    {'_id': 1, 'item': 'ABC1', quarter: '13Q1', 'description': 'product 1'},
    {'_id': 2, 'item': 'ABC2', quarter: '13Q4', 'description': 'product 2'},
    {'_id': 3, 'item': 'XYZ1', quarter: '14Q2', 'description': null}
  ]

  // $concat
  var result = Mingo.aggregate(inventory, [
    {$project: {itemDescription: {$concat: ['$item', ' - ', '$description']}}}
  ])

  t.deepEqual(result, [
    {'_id': 1, 'itemDescription': 'ABC1 - product 1'},
    {'_id': 2, 'itemDescription': 'ABC2 - product 2'},
    {'_id': 3, 'itemDescription': null}
  ], 'aggregate with $concat')

  // $indexOfBytes
  var examples = [
    [ [ 'cafeteria', 'e' ],	3 ],
    [ [ 'cafétéria', 'é' ], 3 ],
    [ [ 'cafétéria', 'e' ], -1 ],
    [ [ 'cafétéria', 't' ], 4 ], // "5" is an error in MongoDB docs.
    [ [ 'foo.bar.fi', '.', 5 ], 7 ],
    [ [ 'vanilla', 'll', 0, 2 ], -1 ],
    [ [ 'vanilla', 'll', -1 ], '$indexOfBytes third operand must resolve to a non-negative integer', true ], // Error
    [ [ 'vanilla', 'll', 12 ], -1 ],
    [ [ 'vanilla', 'll', 5, 2 ], -1 ],
    [ [ 'vanilla', 'nilla', 3 ], -1 ],
    [ [ null, 'foo' ], null ]
  ]

  tryExamples(examples, '$indexOfBytes')

  // $split
  var data = [
    { '_id': 1, 'city': 'Berkeley, CA', 'qty': 648 },
    { '_id': 2, 'city': 'Bend, OR', 'qty': 491 },
    { '_id': 3, 'city': 'Kensington, CA', 'qty': 233 },
    { '_id': 4, 'city': 'Eugene, OR', 'qty': 842 },
    { '_id': 5, 'city': 'Reno, NV', 'qty': 655 },
    { '_id': 6, 'city': 'Portland, OR', 'qty': 408 },
    { '_id': 7, 'city': 'Sacramento, CA', 'qty': 574 }
  ]

  result = Mingo.aggregate(data, [
    { $project: { city_state: { $split: ['$city', ', '] }, qty: 1 } },
    { $unwind: '$city_state' },
    { $match: { city_state: /[A-Z]{2}/ } },
    { $group: { _id: { 'state': '$city_state' }, total_qty: { '$sum': '$qty' } } },
    { $sort: { total_qty: -1 } }
  ])

  t.deepEqual(result, [
    { '_id': { 'state': 'OR' }, 'total_qty': 1741 },
    { '_id': { 'state': 'CA' }, 'total_qty': 1455 },
    { '_id': { 'state': 'NV' }, 'total_qty': 655 }
  ], 'can aggregate with $split')

  examples = [
    [ [ 'June-15-2013', '-' ], 	[ 'June', '15', '2013' ] ],
    [ [ 'banana split', 'a' ], 	[ 'b', 'n', 'n', ' split' ] ],
    [ [ 'Hello World', ' ' ],	[ 'Hello', 'World' ] ],
    [ [ 'astronomical', 'astro' ],	[ '', 'nomical' ] ],
    [ [ 'pea green boat', 'owl' ],	[ 'pea green boat' ] ],
    [ { $split: [ 'headphone jack', 7 ] },	'$split requires an expression that evaluates to a string as a second argument, found: number', true ],
    [ { $split: [ 'headphone jack', /jack/ ] },	'$split requires an expression that evaluates to a string as a second argument, found: regex', true ]
  ]

  tryExamples(examples, '$split')

  // $substr
  result = Mingo.aggregate(inventory, [
    {
      $project: {
        item: 1,
        yearSubstring: {$substr: ['$quarter', 0, 2]},
        quarterSubtring: {$substr: ['$quarter', 2, -1]}
      }
    }
  ])

  t.deepEqual(result, [
    {'_id': 1, 'item': 'ABC1', 'yearSubstring': '13', 'quarterSubtring': 'Q1'},
    {'_id': 2, 'item': 'ABC2', 'yearSubstring': '13', 'quarterSubtring': 'Q4'},
    {'_id': 3, 'item': 'XYZ1', 'yearSubstring': '14', 'quarterSubtring': 'Q2'}
  ], 'aggregate with $substr')

  // for casing functions
  var inventoryMixedCase = [
    {'_id': 1, 'item': 'ABC1', quarter: '13Q1', 'description': 'PRODUCT 1'},
    {'_id': 2, 'item': 'abc2', quarter: '13Q4', 'description': 'Product 2'},
    {'_id': 3, 'item': 'xyz1', quarter: '14Q2', 'description': null}
  ]

  // $toLower
  result = Mingo.aggregate(inventoryMixedCase, [
    {
      $project: {
        item: {$toLower: '$item'},
        description: {$toLower: '$description'}
      }
    }
  ])

  t.deepEqual(result, [
    {'_id': 1, 'item': 'abc1', 'description': 'product 1'},
    {'_id': 2, 'item': 'abc2', 'description': 'product 2'},
    {'_id': 3, 'item': 'xyz1', 'description': ''}
  ], 'aggregate with $toLower')

  // $toUpper
  result = Mingo.aggregate(inventoryMixedCase, [
    {
      $project: {
        item: {$toUpper: '$item'},
        description: {$toUpper: '$description'}
      }
    }
  ])

  t.deepEqual(result, [
    {'_id': 1, 'item': 'ABC1', 'description': 'PRODUCT 1'},
    {'_id': 2, 'item': 'ABC2', 'description': 'PRODUCT 2'},
    {'_id': 3, 'item': 'XYZ1', 'description': ''}
  ], 'aggregate with $toUpper')

  // $strcasecmp
  result = Mingo.aggregate(inventory, [
    {
      $project: {
        item: 1,
        comparisonResult: {$strcasecmp: ['$quarter', '13q4']}
      }
    }
  ])
  t.deepEqual(result, [
    {'_id': 1, 'item': 'ABC1', 'comparisonResult': -1},
    {'_id': 2, 'item': 'ABC2', 'comparisonResult': 0},
    {'_id': 3, 'item': 'XYZ1', 'comparisonResult': 1}
  ], 'aggregate with $strcasecmp')

  t.end()
})
