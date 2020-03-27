var test = require('tape')
var mingo = require('../../es5')
var samples = require('../support')

test("$sort pipeline operator", function (t) {
  var result = mingo.aggregate(samples.studentsData, [
    { '$sort': { '_id': -1 } }
  ]);
  t.ok(result[0]['_id'] === 199, "can sort collection with $sort");

  var data = [
    { _id: 'c', date: new Date(2018, 1, 1) },
    { _id: 'a', date: new Date(2017, 1, 1) },
    { _id: 'b', date: new Date(2017, 1, 1) }
  ];
  var expected = [
    { _id: 'a', date: new Date(2017, 1, 1) },
    { _id: 'b', date: new Date(2017, 1, 1) },
    { _id: 'c', date: new Date(2018, 1, 1) },
  ]

  result = mingo.aggregate(data, [{ "$sort": { "date": 1 } }]);
  t.deepEqual(result, expected, "can sort on complex fields");
  t.end()
});

test('sort with collation', function (t) {

  // english
  let english = [
    { "name" : "Bob" },
    { "name" : "Tom" },
    { "name" : "alice" },
    { "name" : "peggy" },
    { "name" : "21" },
    { "name" : "100" },
  ]
  result = mingo.find(english, {}).collation({locale: "en"}).sort({name: 1}).all()
  t.deepEqual(result, [
    { "name" : "100" },
    { "name" : "21" },
    { "name" : "alice" },
    { "name" : "Bob" },
    { "name" : "peggy" },
    { "name" : "Tom" },
  ], 'can sort with locale')

  result = mingo.find(english, {}).collation({locale: "en", numericOrdering: true}).sort({name: 1}).all()
  t.deepEqual(result, [
    { "name" : "21" },
    { "name" : "100" },
    { "name" : "alice" },
    { "name" : "Bob" },
    { "name" : "peggy" },
    { "name" : "Tom" }
  ], 'can sort with numeric odering')

  // french
  let french = [
    {"name": "a"},
    {"name": "B"},
    {"name": "b"},
    {"name": "c"},
    {"name": "á"},
    {"name": "A"}
  ]
  result = mingo.find(french, {}).collation({locale: "fr"}).sort({name: 1}).all()
  t.deepEqual(result, [
    { name: 'a' },
    { name: 'A' },
    { name: 'á' },
    { name: 'b' },
    { name: 'B' },
    { name: 'c' }
  ], 'can sort with accented letters')

  // upper case letters should come before lower case letters
  result = mingo.find(french, {}).collation({locale: "fr", caseFirst: 'upper'}).sort({name: 1}).all()
  t.deepEqual(result, [
    { name: 'A' },
    { name: 'a' },
    { name: 'á' },
    { name: 'B' },
    { name: 'b' },
    { name: 'c' }
  ], 'can sort upper case letters before lower case')

  // 1:base compare strength
  result = mingo.find(french, {}).collation({locale: "fr", strength: 1}).sort({name: 1}).all()
  t.deepEqual(result, [
    {"name": "a"},
    {"name": "á"},
    {"name": "A"},
    {"name": "B"},
    {"name": "b"},
    {"name": "c"},
  ], 'sort should consider only base differences')

  // 2:accent compare strength
  result = mingo.find(french, {}).collation({locale: "fr", strength: 2}).sort({name: 1}).all()
  t.deepEqual(result, [
    {"name": "a"},
    {"name": "A"},
    {"name": "á"},
    {"name": "B"},
    {"name": "b"},
    {"name": "c"},
  ], 'can sort accented letters')

  // spanish
  let spanish = [
    { "name": "Ánfora" },
    { "name": "Óscar" },
    { "name": "Barça" },
    { "name": "Niño" },
    { "name": "¡Hola!"},
    { "name": "¿qué?" }
  ]
  result = mingo.find(spanish, {}).collation({locale: 'es'}).sort({name: -1}).all()
  t.deepEqual(result, [
    { name: 'Óscar' },
    { name: 'Niño' },
    { name: 'Barça' },
    { name: 'Ánfora' },
    { name: '¿qué?' },
    { name: '¡Hola!' }
  ], 'can sort letters reversed')

  // ignore punctuations. this should preserve the same order as the input
  result = mingo.find([
    {name: 'Hello there'},
    {name: 'Hello,there'},
    {name: 'Hello  there'},
    {name: 'Hello,there'},
  ], {}).collation({locale: 'en', alternate: 'shifted'}).sort().all()
  t.deepEqual(result, [
    {name: 'Hello there'},
    {name: 'Hello,there'},
    {name: 'Hello  there'},
    {name: 'Hello,there'},
  ], 'can sort letters ignoring punctuations')

  t.end()
})