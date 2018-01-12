var test = require('tape')
var mingo = require('../../dist/mingo')
var samples = require('../support')
var _ = mingo._internal()


test('$out pipeline operator', function (t) {
  var data = [
    { "_id" : 8751, "title" : "The Banquet", "author" : "Dante", "copies" : 2 },
    { "_id" : 8752, "title" : "Divine Comedy", "author" : "Dante", "copies" : 1 },
    { "_id" : 8645, "title" : "Eclogues", "author" : "Dante", "copies" : 2 },
    { "_id" : 7000, "title" : "The Odyssey", "author" : "Homer", "copies" : 10 },
    { "_id" : 7020, "title" : "Iliad", "author" : "Homer", "copies" : 10 }
  ]

  var output = []
  var result = mingo.aggregate(data, [
    { $group : { _id : "$author", books: { $push: "$title" } } },
    { $out : output }
  ])

  t.deepEqual(output, [
    { "_id" : "Dante", "books" : [ "The Banquet", "Divine Comedy", "Eclogues" ] },
    { "_id" : "Homer", "books" : [ "The Odyssey", "Iliad" ] }
  ], 'can apply $out operator')

  t.end()
})