var test = require('tape')
var mingo = require('../../dist/mingo')
var runTest = require('./../support').runTest


runTest('Array Operators', {
  $arrayElemAt: [
    [{ $arrayElemAt: [ [ 1, 2, 3 ], 0 ] }, 1],
    [{ $arrayElemAt: [ [ 1, 2, 3 ], -2 ] }, 2],
    [{ $arrayElemAt: [ [ 1, 2, 3 ], 15 ] }, undefined]
  ],
  $arrayToObject: [
    [{ $arrayToObject: { $literal: [{ "k": "item", "v": "abc123"}, { "k": "qty", "v": 25 } ] } }, { "item" : "abc123", "qty" : 25 }],
    [{ $arrayToObject: { $literal:  [ [ "item", "abc123"], [ "qty", 25 ] ] } }, { "item" : "abc123", "qty" : 25 }]
  ],
  $concatArrays: [
    [{ $concatArrays: [ [ "hello", " "], null ] },	null],
    [{ $concatArrays: [ [ "hello", " "], [ "world" ] ] },	[ "hello", " ", "world" ]],
    [{ $concatArrays: [ [ "hello", " "], [ [ "world" ], "again"] ] },	[ "hello", " ", [ "world" ], "again" ]],
    [{ $concatArrays: [ [ "hello", " "], [ [ "universe" ], "again"], ["and", "bye"] ] },	[ "hello", " ", [ "universe" ], "again", "and", "bye" ]]
  ],
  $filter: [
    [
      {
        $filter: {
          input: [ 1, "a", 2, null, 3.1, 4, "5" ],
          as: "num",
          cond: { $and: [
            { $gte: [ "$$num", -9223372036854775807 ] },
            { $lte: [ "$$num", 9223372036854775807 ] }
          ] }
        }
      },
      [ 1, 2, 3.1, 4 ]
    ]
  ],
  $in: [
    [{ $in: [ 2, [ 1, 2, 3 ] ] },	true],
    [{ $in: [ "abc", [ "xyz", "abc" ] ] },	true],
    [{ $in: [ "xy", [ "xyz", "abc" ] ] },	false],
    [{ $in: [ [ "a" ], [ "a" ] ] },	false],
    [{ $in: [ [ "a" ], [ [ "a" ] ] ] },	true],
    [{ $in: [ /^a/, [ "a" ] ] },	false],
    [{ $in: [ /^a/, [ /^a/ ] ] },	true]
  ],
  $indexOfArray: [
    [{ $indexOfArray: null }, null],
    [{ $indexOfArray: [ [ "a", "abc" ], "a" ] },	0],
    [{ $indexOfArray: [ [ "a", "abc", "de", ["de"] ], ["de"] ] },	3],
    [{ $indexOfArray: [ [ 1, 2 ], 5 ] },	-1],
    [{ $indexOfArray: [ [ 1, 2, 3 ], [1, 2] ] },	-1],
    [{ $indexOfArray: [ [ 10, 9, 9, 8, 9 ], 9, 3 ] },	4],
    [{ $indexOfArray: [ [ "a", "abc", "b" ], "b", 0, 1 ] },	-1],
    [{ $indexOfArray: [ [ "a", "abc", "b" ], "b", 1, 0 ] },	-1],
    [{ $indexOfArray: [ [ "a", "abc", "b" ], "b", 20 ] },	-1],
    [{ $indexOfArray: [ [ null, null, null ], null ] },	0],
    [{ $indexOfArray: [ null, "foo" ] },	null],
    [{ $indexOfArray: [ "foo", "foo" ] },	'$indexOfArray expression must resolve to an array.', {err:true}]
  ],
  $isArray: [
    [{ $isArray: [ "hello" ] },	false],
    [{ $isArray: [ [ "hello", "world" ] ] },	true]
  ],
  $objectToArray: [
    [
      { $objectToArray: { item: "foo", qty: 25 } },
      [{ "k": "item", "v": "foo" }, { "k": "qty", "v": 25 }]
    ],
    [
      { $objectToArray: { item: "foo", qty: 25, size: { len: 25, w: 10, uom: "cm" } } },
      [{ "k": "item", "v": "foo" }, { "k": "qty", "v": 25 }, { "k": "size", "v": { "len": 25, "w": 10, "uom": "cm" } }]
    ]
  ],
  $range: [
    [{ $range: [ 0, 10, 2 ] },	[ 0, 2, 4, 6, 8 ]],
    [{ $range: [ 10, 0, -2 ] },	[ 10, 8, 6, 4, 2 ]],
    [{ $range: [ 0, 10, -2 ] },	[ ]],
    [{ $range: [ 0, 5 ] },	[ 0, 1, 2, 3, 4 ]]
  ],
  $reduce: [
    [ { $reduce: { input: null } }, null],
    [
      {
        $reduce: {
          input: ["a", "b", "c"],
          initialValue: "",
          in: { $concat : ["$$value", "$$this"] }
        }
      },
      "abc"
    ],
    [
      {
        $reduce: {
          input: [ 1, 2, 3, 4 ],
          initialValue: { sum: 5, product: 2 },
          in: {
            sum: { $add : ["$$value.sum", "$$this"] },
            product: { $multiply: [ "$$value.product", "$$this" ] }
          }
        }
      },
      { "sum" : 15, "product" : 48 }
    ],
    [
      {
        $reduce: {
          input: [ [ 3, 4 ], [ 5, 6 ] ],
          initialValue: [ 1, 2 ],
          in: { $concatArrays : ["$$value", "$$this"] }
        }
      },
      [ 1, 2, 3, 4, 5, 6 ]
    ]
  ],
  $reverseArray: [
    [{ $reverseArray: [ 1, 2, 3 ] },	[ 3, 2, 1 ]],
    [{ $reverseArray: { $slice: [ [ "foo", "bar", "baz", "qux" ], 1, 2 ] } },	[ "baz", "bar" ]],
    [{ $reverseArray: null },	null],
    [{ $reverseArray: [ ] },	[ ]],
    [{ $reverseArray: [ [ 1, 2, 3 ], [ 4, 5, 6 ] ] },	[ [ 4, 5, 6 ], [ 1, 2, 3 ] ]]
  ],
  $size: [
    [['a', 'b', 'c'], 3],
    [[10], 1],
    [[], 0]
  ],
  $slice: [
    [{ $slice: [ [ 1, 2, 3 ], 1, 1 ] },	[ 2 ]],
    [{ $slice: [ [ 1, 2, 3 ], -2 ] },	[ 2, 3 ]],
    [{ $slice: [ [ 1, 2, 3 ], 15, 2 ] },	[  ]],
    [{ $slice: [ [ 1, 2, 3 ], -15, 2 ] },	[ 1, 2 ]]
  ],
  $zip: [
    [{ $zip: { inputs: [ ['a'], null]}}, null],
    [{ $zip: { inputs: [ [ "a" ], [ "b" ], [ "c" ] ] }},	[ [ "a", "b", "c" ] ]],
    [{ $zip: { inputs: [ [ "a" ], [ "b", "c" ] ] } },	[ [ "a", "b" ] ]],
    [
      {
        $zip: {
          inputs: [ [ 1 ], [ 2, 3 ] ],
          useLongestLength: true
        }
      },
      [ [ 1, 2 ], [ null, 3 ] ]
    ],
    // Because useLongestLength: true, $zip will pad the shorter input arrays with the corresponding defaults elements.
    [
      {
        $zip: {
          inputs: [ [ 1 ], [ 2, 3 ], [ 4 ] ],
          useLongestLength: true,
          defaults: [ "a", "b", "c" ]
        }
      },
      [ [ 1, 2, 4 ], [ "a", 3, "c" ] ]
    ]
  ]
})

test('Array Operators: $map', function (t) {
  // $map
  var result = mingo.aggregate([
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

test('more $slice examples', function (t) {
  var data = [
    { "_id" : 1, "name" : "dave123", favorites: [ "chocolate", "cake", "butter", "apples" ] },
    { "_id" : 2, "name" : "li", favorites: [ "apples", "pudding", "pie" ] },
    { "_id" : 3, "name" : "ahn", favorites: [ "pears", "pecans", "chocolate", "cherries" ] },
    { "_id" : 4, "name" : "ty", favorites: [ "ice cream" ] }
  ]

  var result = mingo.aggregate(data,[
    { $project: { name: 1, threeFavorites: { $slice: [ "$favorites", 3 ] } } }
  ])

  t.deepEqual(result, [
    { "_id" : 1, "name" : "dave123", "threeFavorites" : [ "chocolate", "cake", "butter" ] },
    { "_id" : 2, "name" : "li", "threeFavorites" : [ "apples", "pudding", "pie" ] },
    { "_id" : 3, "name" : "ahn", "threeFavorites" : [ "pears", "pecans", "chocolate" ] },
    { "_id" : 4, "name" : "ty", "threeFavorites" : [ "ice cream" ] }
  ], 'can project with $slice aggregation')

  t.end()
})

test('Array Operators: $arrayToObject + $objectToArray', function (t) {
  // $arrayToObject + $objectToArray
  var inventory = [
    { "_id" : 1, "item" : "ABC1", instock: { warehouse1: 2500, warehouse2: 500 } },
    { "_id" : 2, "item" : "ABC2", instock: { warehouse2: 500, warehouse3: 200} }
  ]

  result = mingo.aggregate(inventory, [
    { $addFields: { instock: { $objectToArray: "$instock" } } },
    { $addFields: { instock: { $concatArrays: [ "$instock", [ { "k": "total", "v": { $sum: "$instock.v" } } ] ] } } } ,
    { $addFields: { instock: { $arrayToObject: "$instock" } } }
  ])

  t.deepEqual([
    { "_id" : 1, "item" : "ABC1", "instock" : { "warehouse1" : 2500, "warehouse2" : 500, "total" : 3000 } },
    { "_id" : 2, "item" : "ABC2", "instock" : { "warehouse2" : 500, "warehouse3" : 200, "total" : 700 } }
  ], result, 'can apply $objectToArray + $arrayToObject operators together')
  t.end()
})

test('$concatArrays more examples', function (t) {
  var inventory = [
        { "_id" : 1, "instock": [1, 2, 3], "ordered": [4, 5, 6], "shipped": [7, 8, 9]},
        { "_id" : 2, "instock": [10] }
      ]

      result = mingo.aggregate(inventory, [
        { $project: { ids: { $concatArrays: ["$instock", "$ordered", "$shipped"] } } }
      ])

      t.deepEqual([
        { ids: [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ], _id: 1 },
        { ids: null, _id: 2 }
      ], result, 'can concat more than 2 arrays using $concatArrays')
      t.end()
})
