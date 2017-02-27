var test = require('tape')
var Mingo = require('../mingo')
var tryExamples = require('./samples').tryExamples

test('Array Operators', function (t) {
  var result = Mingo.aggregate([
    {'_id': 1, 'item': 'ABC1', 'description': 'product 1', colors: ['blue', 'black', 'red']},
    {'_id': 2, 'item': 'ABC2', 'description': 'product 2', colors: ['purple']},
    {'_id': 3, 'item': 'XYZ1', 'description': 'product 3', colors: []}
  ], [{
    $project: {
      item: 1,
      numberOfColors: {$size: '$colors'}
    }
  }])

  t.deepEqual(result, [
    {'_id': 1, 'item': 'ABC1', 'numberOfColors': 3},
    {'_id': 2, 'item': 'ABC2', 'numberOfColors': 1},
    {'_id': 3, 'item': 'XYZ1', 'numberOfColors': 0}
  ], 'can apply $size operator')

  result = Mingo.aggregate([
    { '_id': 1, 'name': 'dave123', favorites: [ 'chocolate', 'cake', 'butter', 'apples' ] },
    { '_id': 2, 'name': 'li', favorites: [ 'apples', 'pudding', 'pie' ] },
    { '_id': 3, 'name': 'ahn', favorites: [ 'pears', 'pecans', 'chocolate', 'cherries' ] },
    { '_id': 4, 'name': 'ty', favorites: [ 'ice cream' ] }
  ], [
    {
      $project:
      {
        name: 1,
        first: { $arrayElemAt: [ '$favorites', 0 ] },
        last: { $arrayElemAt: [ '$favorites', -1 ] }
      }
    }
  ])

  t.deepEqual(result, [
    { '_id': 1, 'name': 'dave123', 'first': 'chocolate', 'last': 'apples' },
    { '_id': 2, 'name': 'li', 'first': 'apples', 'last': 'pie' },
    { '_id': 3, 'name': 'ahn', 'first': 'pears', 'last': 'cherries' },
    { '_id': 4, 'name': 'ty', 'first': 'ice cream', 'last': 'ice cream' }
  ], 'can apply $arrayElemAt operator')

  // $concatArrays
  result = Mingo.aggregate([
    { '_id': 1, instock: [ 'chocolate' ], ordered: [ 'butter', 'apples' ] },
    { '_id': 2, instock: [ 'apples', 'pudding', 'pie' ] },
    { '_id': 3, instock: [ 'pears', 'pecans' ], ordered: [ 'cherries' ] },
    { '_id': 4, instock: [ 'ice cream' ], ordered: [ ] }
  ], [
   { $project: { items: { $concatArrays: [ '$instock', '$ordered' ] } } }
  ])

  t.deepEqual(result, [
    { '_id': 1, 'items': [ 'chocolate', 'butter', 'apples' ] },
    { '_id': 2, 'items': null },
    { '_id': 3, 'items': [ 'pears', 'pecans', 'cherries' ] },
    { '_id': 4, 'items': [ 'ice cream' ] }
  ], 'can apply $concatArrays opertator')

  // $filter
  var data = [
    {
      _id: 0,
      items: [
         { item_id: 43, quantity: 2, price: 10 },
         { item_id: 2, quantity: 1, price: 240 }
      ]
    },
    {
      _id: 1,
      items: [
         { item_id: 23, quantity: 3, price: 110 },
         { item_id: 103, quantity: 4, price: 5 },
         { item_id: 38, quantity: 1, price: 300 }
      ]
    },
    {
      _id: 2,
      items: [
           { item_id: 4, quantity: 1, price: 23 }
      ]
    }
  ]

  result = Mingo.aggregate(data, [
    {
      $project: {
        items: {
          $filter: {
            input: '$items',
            as: 'item',
            cond: { $gte: [ '$$item.price', 100 ] }
          }
        }
      }
    }
  ])

  t.deepEqual(result, [
    {
      '_id': 0,
      'items': [
          { 'item_id': 2, 'quantity': 1, 'price': 240 }
      ]
    },
    {
      '_id': 1,
      'items': [
          { 'item_id': 23, 'quantity': 3, 'price': 110 },
          { 'item_id': 38, 'quantity': 1, 'price': 300 }
      ]
    },
    { '_id': 2, 'items': [ ] }
  ], 'can apply $filter array operator')

  // $indexOfArray
  data = [
    { '_id': 1, 'items': ['one', 'two', 'three'] },
    { '_id': 2, 'items': [1, 2, 3] },
    { '_id': 3, 'items': [null, null, 2] },
    { '_id': 4, 'items': null },
    { '_id': 5, 'amount': 3 }
  ]

  result = Mingo.aggregate(data,
    [
      {
        $project:
        {
          index: { $indexOfArray: [ '$items', 2 ] }
        }
      }
    ])

  t.deepEqual(result, [
    { '_id': 1, 'index': -1 },
    { '_id': 2, 'index': 1 },
    { '_id': 3, 'index': 2 },
    { '_id': 4, 'index': null },
    { '_id': 5, 'index': null }
  ], 'can apply $indexOfArray array operator')

  // $isArray
  var warehouses = [
    { '_id': 1, instock: [ 'chocolate' ], ordered: [ 'butter', 'apples' ] },
    { '_id': 2, instock: [ 'apples', 'pudding', 'pie' ] },
    { '_id': 3, instock: [ 'pears', 'pecans'], ordered: [ 'cherries' ] },
    { '_id': 4, instock: [ 'ice cream' ], ordered: [ ] }
  ]

  result = Mingo.aggregate(warehouses, [
    { $project:
    { items:
    { $cond:
    {
      if: { $and: [ { $isArray: '$instock' }, { $isArray: '$ordered' } ] },
      then: { $concatArrays: [ '$instock', '$ordered' ] },
      else: 'One or more fields is not an array.'
    }
    }
    }
    }
  ])

  t.deepEqual(result, [
    { '_id': 1, 'items': [ 'chocolate', 'butter', 'apples' ] },
    { '_id': 2, 'items': 'One or more fields is not an array.' },
    { '_id': 3, 'items': [ 'pears', 'pecans', 'cherries' ] },
    { '_id': 4, 'items': [ 'ice cream' ] }
  ], 'can apply $isArray operator')

  // $range
  var distances = [
    { _id: 0, city: 'San Jose', distance: 42 },
    { _id: 1, city: 'Sacramento', distance: 88 },
    { _id: 2, city: 'Reno', distance: 218 },
    { _id: 3, city: 'Los Angeles', distance: 383 }
  ]

  result = Mingo.aggregate(distances, [
    {
      $project: {
        _id: 0,
        city: 1,
        'Rest stops': { $range: [ 0, '$distance', 25 ] }
      }
    }
  ])

  t.deepEqual(result, [
    { 'city': 'San Jose', 'Rest stops': [ 0, 25 ] },
    { 'city': 'Sacramento', 'Rest stops': [ 0, 25, 50, 75 ] },
    { 'city': 'Reno', 'Rest stops': [ 0, 25, 50, 75, 100, 125, 150, 175, 200 ] },
    { 'city': 'Los Angeles', 'Rest stops': [ 0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375 ] }
  ], 'can apply $range operator')

  var examples = [
    [[ 0, 10, 2 ], [ 0, 2, 4, 6, 8 ]],
    [[ 10, 0, -2 ], [ 10, 8, 6, 4, 2 ]],
    [[ 0, 10, -2 ], [ ]],
    [[ 0, 5 ], [ 0, 1, 2, 3, 4]]
  ]

  tryExamples(examples, '$range')

  // $reverseArray
  data = [
    { '_id': 1, 'name': 'dave123', 'favorites': [ 'chocolate', 'cake', 'butter', 'apples' ] },
    { '_id': 2, 'name': 'li', 'favorites': [ 'apples', 'pudding', 'pie' ] },
    { '_id': 3, 'name': 'ahn', 'favorites': [ ] },
    { '_id': 4, 'name': 'ty' }
  ]

  result = Mingo.aggregate(data, [
    {
      $project:
      {
        name: 1,
        reverseFavorites: { $reverseArray: '$favorites' }
      }
    }
  ])

  t.deepEqual(result, [
    { '_id': 1, 'name': 'dave123', 'reverseFavorites': [ 'apples', 'butter', 'cake', 'chocolate' ] },
    { '_id': 2, 'name': 'li', 'reverseFavorites': [ 'pie', 'pudding', 'apples' ] },
    { '_id': 3, 'name': 'ahn', 'reverseFavorites': [ ] },
    { '_id': 4, 'name': 'ty', 'reverseFavorites': null }
  ], 'can apply $reverseArray operator')

  examples = [
    [ [ 1, 2, 3 ], [ 3, 2, 1 ] ],
    [ { $slice: [ [ 'foo', 'bar', 'baz', 'qux' ], 1, 2 ] }, [ 'baz', 'bar' ] ],
    [ null, null ],
    [ [], [] ],
    [ [ [ 1, 2, 3 ], [ 4, 5, 6 ] ], [ [ 4, 5, 6 ], [ 1, 2, 3 ] ] ]
  ]

  tryExamples(examples, '$reverseArray')

  // $slice
  data = [
    { '_id': 1, 'name': 'dave123', favorites: [ 'chocolate', 'cake', 'butter', 'apples' ] },
    { '_id': 2, 'name': 'li', favorites: [ 'apples', 'pudding', 'pie' ] },
    { '_id': 3, 'name': 'ahn', favorites: [ 'pears', 'pecans', 'chocolate', 'cherries' ] },
    { '_id': 4, 'name': 'ty', favorites: [ 'ice cream' ] }
  ]

  result = Mingo.aggregate(data, [
    { $project: { name: 1, threeFavorites: { $slice: [ '$favorites', 3 ] } } }
  ])

  t.deepEqual(result, [
    { '_id': 1, 'name': 'dave123', 'threeFavorites': [ 'chocolate', 'cake', 'butter' ] },
    { '_id': 2, 'name': 'li', 'threeFavorites': [ 'apples', 'pudding', 'pie' ] },
    { '_id': 3, 'name': 'ahn', 'threeFavorites': [ 'pears', 'pecans', 'chocolate' ] },
    { '_id': 4, 'name': 'ty', 'threeFavorites': [ 'ice cream' ] }
  ], 'can apply $slice array aggregation operator')

  examples = [
    [ [ [ 1, 2, 3 ], 1, 1 ], [ 2 ] ],
    [ [ [ 1, 2, 3 ], -2 ], [ 2, 3 ] ],
    [ [ [ 1, 2, 3 ], 15, 2 ], [] ],
    [ [ [ 1, 2, 3 ], -15, 2 ], [ 1, 2 ] ]
  ]

  tryExamples(examples, '$slice')

  // $reduce
  data = [
    {_id: 1, 'type': 'die', 'experimentId': 'r5', 'description': 'Roll a 5', 'eventNum': 1, 'probability': 0.16666666666667},
    {_id: 2, 'type': 'card', 'experimentId': 'd3rc', 'description': 'Draw 3 red cards', 'eventNum': 1, 'probability': 0.5},
    {_id: 3, 'type': 'card', 'experimentId': 'd3rc', 'description': 'Draw 3 red cards', 'eventNum': 2, 'probability': 0.49019607843137},
    {_id: 4, 'type': 'card', 'experimentId': 'd3rc', 'description': 'Draw 3 red cards', 'eventNum': 3, 'probability': 0.48},
    {_id: 5, 'type': 'die', 'experimentId': 'r16', 'description': 'Roll a 1 then a 6', 'eventNum': 1, 'probability': 0.16666666666667},
    {_id: 6, 'type': 'die', 'experimentId': 'r16', 'description': 'Roll a 1 then a 6', 'eventNum': 2, 'probability': 0.16666666666667},
    {_id: 7, 'type': 'card', 'experimentId': 'dak', 'description': 'Draw an ace, then a king', 'eventNum': 1, 'probability': 0.07692307692308},
    {_id: 8, 'type': 'card', 'experimentId': 'dak', 'description': 'Draw an ace, then a king', 'eventNum': 2, 'probability': 0.07843137254902}
  ]

  result = Mingo.aggregate(data,
    [
      {
        $group: {
          _id: '$experimentId',
          'probabilityArr': { $push: '$probability' }
        }
      },
      {
        $project: {
          'description': 1,
          'results': {
            $reduce: {
              input: '$probabilityArr',
              initialValue: 1,
              in: { $multiply: [ '$$value', '$$this' ] }
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]
  )

  t.deepEqual(result, [
    { '_id': 'd3rc', 'results': 0.11764705882352879 },
    { '_id': 'dak', 'results': 0.00603318250377101 },
    { '_id': 'r16', 'results': 0.027777777777778886 },
    { '_id': 'r5', 'results': 0.16666666666667 }
  ], '$reduce: Probability example')

  data = [
    { '_id': 1, 'productId': 'ts1', 'description': 'T-Shirt', 'color': 'black', 'size': 'M', 'price': 20, 'discounts': [ 0.5, 0.1 ] },
    { '_id': 2, 'productId': 'j1', 'description': 'Jeans', 'color': 'blue', 'size': '36', 'price': 40, 'discounts': [ 0.25, 0.15, 0.05 ] },
    { '_id': 3, 'productId': 's1', 'description': 'Shorts', 'color': 'beige', 'size': '32', 'price': 30, 'discounts': [ 0.15, 0.05 ] },
    { '_id': 4, 'productId': 'ts2', 'description': 'Cool T-Shirt', 'color': 'White', 'size': 'L', 'price': 25, 'discounts': [ 0.3 ] },
    { '_id': 5, 'productId': 'j2', 'description': 'Designer Jeans', 'color': 'blue', 'size': '30', 'price': 80, 'discounts': [ 0.1, 0.25 ] }
  ]

  result = Mingo.aggregate(data,
    [
      {
        $project: {
          'discountedPrice': {
            $reduce: {
              input: '$discounts',
              initialValue: '$price',
              in: { $multiply: [ '$$value', { $subtract: [ 1, '$$this' ] } ] }
            }
          }
        }
      }
    ]
  )

  t.deepEqual(result, [
    { '_id': 1, 'discountedPrice': 9 },
    { '_id': 2, 'discountedPrice': 24.224999999999998 },
    { '_id': 3, 'discountedPrice': 24.224999999999998 },
    { '_id': 4, 'discountedPrice': 17.5 },
    { '_id': 5, 'discountedPrice': 54 }
  ], '$reduce: Discounted Merchandise example')

  data = [
    { '_id': 1, 'name': 'Melissa', 'hobbies': [ 'softball', 'drawing', 'reading' ] },
    { '_id': 2, 'name': 'Brad', 'hobbies': [ 'gaming', 'skateboarding' ] },
    { '_id': 3, 'name': 'Scott', 'hobbies': [ 'basketball', 'music', 'fishing' ] },
    { '_id': 4, 'name': 'Tracey', 'hobbies': [ 'acting', 'yoga' ] },
    { '_id': 5, 'name': 'Josh', 'hobbies': [ 'programming' ] },
    { '_id': 6, 'name': 'Claire' }
  ]

  result = Mingo.aggregate(data,
    [
       // Filter to return only non-empty arrays
       { $match: { 'hobbies': { $gt: [ ] } } },
      {
        $project: {
          'name': 1,
          'bio': {
            $reduce: {
              input: '$hobbies',
              initialValue: 'My hobbies include:',
              in: {
                $concat: [
                  '$$value',
                  {
                    $cond: {
                      if: { $eq: [ '$$value', 'My hobbies include:' ] },
                      then: ' ',
                      else: ', '
                    }
                  },
                  '$$this'
                ]
              }
            }
          }
        }
      }
    ]
  )

  t.deepEqual(result, [
    { '_id': 1, 'name': 'Melissa', 'bio': 'My hobbies include: softball, drawing, reading' },
    { '_id': 2, 'name': 'Brad', 'bio': 'My hobbies include: gaming, skateboarding' },
    { '_id': 3, 'name': 'Scott', 'bio': 'My hobbies include: basketball, music, fishing' },
    { '_id': 4, 'name': 'Tracey', 'bio': 'My hobbies include: acting, yoga' },
    { '_id': 5, 'name': 'Josh', 'bio': 'My hobbies include: programming' }
  ], '$reduce: String Concatenation example')

  var matrices = [
    { '_id': 1, 'arr': [ [ 24, 55, 79 ], [ 14, 78, 35 ], [ 84, 90, 3 ], [ 50, 89, 70 ] ] },
    { '_id': 2, 'arr': [ [ 39, 32, 43, 7 ], [ 62, 17, 80, 64 ], [ 17, 88, 11, 73 ] ] },
    { '_id': 3, 'arr': [ [ 42 ], [ 26, 59 ], [ 17 ], [ 72, 19, 35 ] ] },
    { '_id': 4 }
  ]

  result = Mingo.aggregate(matrices,
    [
      {
        $project: {
          'collapsed': {
            $reduce: {
              input: '$arr',
              initialValue: [ ],
              in: { $concatArrays: [ '$$value', '$$this' ] }
            }
          }
        }
      }
    ]
  )

  t.deepEqual(result, [
    { '_id': 1, 'collapsed': [ 24, 55, 79, 14, 78, 35, 84, 90, 3, 50, 89, 70 ] },
    { '_id': 2, 'collapsed': [ 39, 32, 43, 7, 62, 17, 80, 64, 17, 88, 11, 73 ] },
    { '_id': 3, 'collapsed': [ 42, 26, 59, 17, 72, 19, 35 ] },
    { '_id': 4, 'collapsed': null }
  ], '$reduce: Array Concatenation example - Computing a Single Reduction')

  result = Mingo.aggregate(matrices,
    [
      {
        $project: {
          'results': {
            $reduce: {
              input: '$arr',
              initialValue: [ ],
              in: {
                'collapsed': {
                  $concatArrays: [ '$$value.collapsed', '$$this' ]
                },
                'firstValues': {
                  $concatArrays: [ '$$value.firstValues', { $slice: [ '$$this', 1 ] } ]
                }
              }
            }
          }
        }
      }
    ]
  )

  t.deepEqual(result, [
    { '_id': 1, 'results': { 'collapsed': [ 24, 55, 79, 14, 78, 35, 84, 90, 3, 50, 89, 70 ], 'firstValues': [ 24, 14, 84, 50 ] } },
    { '_id': 2, 'results': { 'collapsed': [ 39, 32, 43, 7, 62, 17, 80, 64, 17, 88, 11, 73 ], 'firstValues': [ 39, 62, 17 ] } },
    { '_id': 3, 'results': { 'collapsed': [ 42, 26, 59, 17, 72, 19, 35 ], 'firstValues': [ 42, 26, 17, 72 ] } },
    { '_id': 4, 'results': null }
  ], '$reduce: Array Concatenation example - Computing a Single Reduction')

  examples = [
    [
      {
        input: ['a', 'b', 'c'],
        initialValue: '',
        in: { $concat: ['$$value', '$$this'] }
      },
      'abc'
    ],
    [
      {
        input: [ 1, 2, 3, 4 ],
        initialValue: { sum: 5, product: 2 },
        in: {
          sum: { $add: ['$$value.sum', '$$this'] },
          product: { $multiply: [ '$$value.product', '$$this' ] }
        }
      },
      { 'sum': 15, 'product': 48 }
    ],
    [
      {
        input: [ [ 3, 4 ], [ 5, 6 ] ],
        initialValue: [ 1, 2 ],
        in: { $concatArrays: ['$$value', '$$this'] }
      },
      [ 1, 2, 3, 4, 5, 6 ]
    ]
  ]

  tryExamples(examples, '$reduce')

  // $in
  data = [
    { '_id': 1, 'location': '24th Street', 'in_stock': [ 'apples', 'oranges', 'bananas' ] },
    { '_id': 2, 'location': '36th Street', 'in_stock': [ 'bananas', 'pears', 'grapes' ] },
    { '_id': 3, 'location': '82nd Street', 'in_stock': [ 'cantaloupes', 'watermelons', 'apples' ] }
  ]

  result = Mingo.aggregate(data, [
    {
      $project: {
        'store location': '$location',
        'has bananas': {
          $in: [ 'bananas', '$in_stock' ]
        }
      }
    }
  ])

  t.deepEqual(result, [
    { '_id': 1, 'store location': '24th Street', 'has bananas': true },
    { '_id': 2, 'store location': '36th Street', 'has bananas': true },
    { '_id': 3, 'store location': '82nd Street', 'has bananas': false }
  ], 'can apply $in array aggregation operator')

  // $zip
  data = [
    { matrix: [[1, 2], [2, 3], [3, 4]] },
    { matrix: [[8, 7], [7, 6], [5, 4]] }
  ]

  result = Mingo.aggregate(data, [{
    $project: {
      _id: false,
      transposed: {
        $zip: {
          inputs: [
            { $arrayElemAt: [ '$matrix', 0 ] },
            { $arrayElemAt: [ '$matrix', 1 ] },
            { $arrayElemAt: [ '$matrix', 2 ] }
          ]
        }
      }
    }
  }])

  t.deepEqual(result, [
    { 'transposed': [ [ 1, 2, 3 ], [ 2, 3, 4 ] ] },
    { 'transposed': [ [ 8, 7, 5 ], [ 7, 6, 4 ] ] }
  ], '$zip : Matrix Transposition example')

  data = [
    {
      'category': 'unix',
      'pages': [
        { 'title': 'awk for beginners', reviews: 5 },
        { 'title': 'sed for newbies', reviews: 0 },
        { 'title': 'grep made simple', reviews: 2 }
      ]
    }
  ]

  result = Mingo.aggregate(data, [{
    $project: {
      _id: false,
      pages: {
        $filter: {
          input: {
            $zip: {
              inputs: [ '$pages', { $range: [0, { $size: '$pages' }] } ]
            }
          },
          as: 'pageWithIndex',
          cond: {
            $let: {
              vars: {
                page: { $arrayElemAt: [ '$$pageWithIndex', 0 ] }
              },
              in: { $gte: [ '$$page.reviews', 1 ] }
            }
          }
        }
      }
    }
  }])

  t.deepEqual(result, [
    {
      'pages': [
        [ { 'title': 'awk for beginners', 'reviews': 5 }, 0 ],
        [ { 'title': 'grep made simple', 'reviews': 2 }, 2 ] ]
    }
  ], '$zip : Filtering and Preserving Indexes')

  examples = [
    [ { inputs: [ [ 'a' ], [ 'b' ], [ 'c' ] ] }, [ [ 'a', 'b', 'c' ] ] ],
    [ { inputs: [ [ 'a' ], [ 'b', 'c' ] ] }, [ [ 'a', 'b' ] ] ],
    [
      {
        inputs: [ [ 1 ], [ 2, 3 ] ],
        useLongestLength: true
      },
      [ [ 1, 2 ], [ null, 3 ] ]
    ],
    [
      {
        inputs: [ [ 1 ], [ 2, 3 ], [ 4 ] ],
        useLongestLength: true,
        defaults: [ 'a', 'b', 'c' ]
      },
      [ [ 1, 2, 4 ], [ 'a', 3, 'c' ] ]
    ]
  ]

  tryExamples(examples, '$zip')

  t.end()
})
