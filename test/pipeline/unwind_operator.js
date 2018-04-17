var test = require('tape')
var mingo = require('../../dist/mingo')
var samples = require('../support')
var _ = mingo._internal()


test("$unwind pipeline operator", function (t) {
  var flattened = mingo.aggregate(samples.studentsData, [
    { '$unwind': '$scores' }
  ]);
  t.ok(flattened.length === 800, "can unwind array value in collection");

  var data = [
    { "_id" : 1, "item" : "ABC", "sizes": [ "S", "M", "L"] },
    { "_id" : 2, "item" : "EFG", "sizes" : [ ] },
    { "_id" : 3, "item" : "IJK", "sizes": "M" },
    { "_id" : 4, "item" : "LMN" },
    { "_id" : 5, "item" : "XYZ", "sizes" : null }
  ]

  var a = mingo.aggregate(data, [ { $unwind: "$sizes" } ] )
  var b = mingo.aggregate(data, [ { $unwind: { path: "$sizes" } } ] )
  var expected = [
    { "_id" : 1, "item" : "ABC", "sizes" : "S" },
    { "_id" : 1, "item" : "ABC", "sizes" : "M" },
    { "_id" : 1, "item" : "ABC", "sizes" : "L" },
    { "_id" : 3, "item" : "IJK", "sizes" : "M" }
  ]
  t.deepEqual(a, expected, 'can $unwind with field path')
  t.deepEqual(b, expected, 'can $unwind with object expression')

  var result = mingo.aggregate(data, [ { $unwind: { path: "$sizes", includeArrayIndex: "arrayIndex" } } ] )
  t.deepEqual(result, [
    { "_id" : 1, "item" : "ABC", "sizes" : "S", "arrayIndex" : 0 },
    { "_id" : 1, "item" : "ABC", "sizes" : "M", "arrayIndex" : 1 },
    { "_id" : 1, "item" : "ABC", "sizes" : "L", "arrayIndex" : 2 },
    { "_id" : 3, "item" : "IJK", "sizes" : "M", "arrayIndex" : null }
  ], 'can $unwind with option "includeArrayIndex"')

  result = mingo.aggregate(data, [
    { $unwind: { path: "$sizes", preserveNullAndEmptyArrays: true } }
  ] )

  t.deepEqual(result, [
    { "_id" : 1, "item" : "ABC", "sizes" : "S" },
    { "_id" : 1, "item" : "ABC", "sizes" : "M" },
    { "_id" : 1, "item" : "ABC", "sizes" : "L" },
    { "_id" : 2, "item" : "EFG" },
    { "_id" : 3, "item" : "IJK", "sizes" : "M" },
    { "_id" : 4, "item" : "LMN" },
    { "_id" : 5, "item" : "XYZ", "sizes" : null }
  ], 'can $unwind with option "preserveNullAndEmptyArrays"')

  //https://github.com/kofrasa/mingo/issues/80
  result = mingo.aggregate([
      { "_id" : 1, "item" : "ABC", "a":{"sizes": [ "S", "M", "L"] }},
      { "_id" : 2, "item" : "EFG", "a":{"sizes" : [ ] }},
      { "_id" : 3, "item" : "IJK", "a":{"sizes": "M"} },
      { "_id" : 4, "item" : "LMN", "a":{}},
      { "_id" : 5, "item" : "XYZ", "a":{"sizes" : null} }
    ], [ { $unwind: "$a.sizes" } ] )

    t.deepEqual(result, [
      { "_id" : 1, "item" : "ABC", "a" : { "sizes" : "S" } },
      { "_id" : 1, "item" : "ABC", "a" : { "sizes" : "M" } },
      { "_id" : 1, "item" : "ABC", "a" : { "sizes" : "L" } },
      { "_id" : 3, "item" : "IJK", "a" : { "sizes" : "M" } }
    ], '$unwind array nested within object')

  t.end()
});