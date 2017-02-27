var test = require('tape')
var Mingo = require('../mingo')
var samples = require('./samples')

function ObjectId (id) {
  this.id = id
}

var objectId = new ObjectId(100)

var obj = samples.person
obj['_id'] = objectId
obj['today'] = new Date()

test('Comparison, Evaluation, and Element Operators', function (t) {
  t.plan(25)
  var queries = [
    [{_id: objectId}, 'can match against user-defined types'],
    [{firstName: 'Francis'}, 'can check for equality with $eq'],
    [{lastName: /^a.+e/i}, 'can check against regex with literal'],
    [{lastName: {$regex: 'a.+e', $options: 'i'}}, 'can check against regex with $regex operator'],
    [{username: {$not: 'mufasa'}}, 'can apply $not to direct values'],
    [{username: {$not: {$ne: 'kofrasa'}}}, 'can apply $not to sub queries'],
    [{jobs: {$gt: 1}}, 'can compare with $gt'],
    [{jobs: {$gte: 6}}, 'can compare with $gte'],
    [{jobs: {$lt: 10}}, 'can compare with $lt'],
    [{jobs: {$lte: 6}}, 'can compare with $lte'],
    [{middlename: {$exists: false}}, 'can check if value does not exists with $exists'],
    [{projects: {$exists: true}}, 'can check if value exists with $exists'],
    [{'projects.C.1': 'student_record'}, 'can compare value inside array at a given index'],
    [{'circles.school': {$in: ['Henry']}}, 'can check that value is in array with $in'],
    [{'circles.family': {$nin: ['Pamela']}}, 'can check that value is not in array with $nin'],
    [{'languages.programming': {$size: 7}}, 'can determine size of nested array with $size'],
    [{'projects.Python': 'Flaskapp'}, 'can match nested elements in array'],
    [{'date.month': {$mod: [8, 1]}}, 'can find modulo of values with $mod'],
    [{'languages.spoken': {$all: ['french', 'english']}}, 'can check that all values exists in array with $all'],
    [{date: {year: 2013, month: 9, day: 25}}, 'can match field with object values'],
    [{'grades.0.grade': 92}, 'can match fields for objects in a given position in an array with dot notation'],
    [{'grades.mean': {$gt: 70}}, 'can match fields for all objects within an array with dot notation'],
    [{grades: {$elemMatch: {mean: {$gt: 70}}}}, 'can match fields for all objects within an array with $elemMatch'],
    [{today: {$type: 9}}, 'can match type of fields with $type'],
    [{$where: 'this.jobs === 6 && this.grades.length < 10'}, 'can match with $where expression']
  ]

  queries.forEach(function (q) {
    t.ok(Mingo.Query(q[0]).test(obj), q[1])
  })
})

test('Projection Operators', function (t) {
  var data = [obj]
  var result = Mingo.find(data, {}, {'languages.programming': {$slice: [-3, 2]}}).first()
  t.deepEqual(result['languages']['programming'], ['Javascript', 'Bash'], 'should project with $slice operator')

  // special tests
  // https://github.com/kofrasa/mingo/issues/25
  data = [{
    key0: [{
      key1: [[[{key2: [{a: 'value2'}, {a: 'dummy'}, {'b': 20}]}]], {'key2': 'value'}],
      key1a: {key2a: 'value2a'}
    }]
  }]
  
  var expected = {'key0': [{'key1': [[[{'key2': [{'a': 'value2'}, {'a': 'dummy'}]}]]]}]}
  
  result = Mingo.find(data, {'key0.key1.key2': 'value'}, {'key0.key1.key2.a': 1}).first()
  t.deepEqual(result, expected, 'should project only selected object graph from nested arrays')
  t.notDeepEqual(data[0], result, 'should not modify original')

  data = [ { 'name': 'Steve', 'age': 15, 'features': { 'hair': 'brown', 'eyes': 'brown' } } ]
  result = Mingo.find(data, {}, { 'features.hair': 1 }).first()
  t.deepEqual(result, {'features': {hair: 'brown'}}, 'should project only selected object graph')
  t.notDeepEqual(data[0], result, 'should not modify original')

  t.throws(function () {
    Mingo.find(data, {}, { 'features.hair': 0, 'name': 1 }).first()
  }, Error, 'should throw exception: Projection cannot have a mix of inclusion and exclusion')

  result = Mingo.find(data, {}, { 'features.hair': 0}).first()
  t.deepEqual(result, {'name': 'Steve', 'age': 15, 'features': {'eyes': 'brown'}}, 'should omit key')
  t.notDeepEqual(data[0], result, 'should not modify original')

  data = [{ 'name': 'Steve', 'age': 15, 'features': ['hair', 'eyes', 'nose']} ]
  result = Mingo.find(data, {}, { 'features.1': 0}).first()
  t.deepEqual(result, {'name': 'Steve', 'age': 15, 'features': ['hair', 'nose']}, 'should omit second element in array')
  t.notDeepEqual(data[0], result, 'should not modify original')

  result = Mingo.find(data, {}, { 'features.1': 1}).first()
  t.deepEqual(result, {'features': ['eyes']}, 'should select only second element in array')
  t.notDeepEqual(data[0], result, 'should not modify original')

  t.end()
})

test('Logical Operators', function (t) {
  t.plan(12)
  var queries = [
    [{$and: [{firstName: 'Francis'}, {lastName: /^a.+e/i}]}, 'can use conjunction true AND true'],
    [{$and: [{firstName: 'Francis'}, {lastName: 'Amoah'}]}, false, 'can use conjunction true AND false'],
    [{$and: [{firstName: 'Enoch'}, {lastName: 'Asante'}]}, false, 'can use conjunction false AND true'],
    [{$and: [{firstName: 'Enoch'}, {age: {$exists: true}}]}, false, 'can use conjunction false AND false'],
    // or
    [{$or: [{firstName: 'Francis'}, {lastName: /^a.+e/i}]}, 'can use conjunction true OR true'],
    [{$or: [{firstName: 'Francis'}, {lastName: 'Amoah'}]}, 'can use conjunction true OR false'],
    [{$or: [{firstName: 'Enoch'}, {lastName: 'Asante'}]}, 'can use conjunction false OR true'],
    [{$or: [{firstName: 'Enoch'}, {age: {$exists: true}}]}, false, 'can use conjunction false OR false'],
    // nor
    [{$nor: [{firstName: 'Francis'}, {lastName: /^a.+e/i}]}, false, 'can use conjunction true NOR true'],
    [{$nor: [{firstName: 'Francis'}, {lastName: 'Amoah'}]}, false, 'can use conjunction true NOR false'],
    [{$nor: [{firstName: 'Enoch'}, {lastName: 'Asante'}]}, false, 'can use conjunction false NOR true'],
    [{$nor: [{firstName: 'Enoch'}, {age: {$exists: true}}]}, 'can use conjunction false NOR false']
  ]

  queries.forEach(function (q) {
    if (q.length === 2) {
      t.ok(new Mingo.Query(q[0]).test(obj), q[1])
    } else if (q.length === 3) {
      t.equal(new Mingo.Query(q[0]).test(obj), q[1], q[2])
    }
  })
})

test('Array Operators', function (t) {
  var data = [
    {
      '_id': '5234ccb7687ea597eabee677',
      'code': 'efg',
      'tags': ['school', 'book'],
      'qty': [
        {'size': 'S', 'num': 10, 'color': 'blue'},
        {'size': 'M', 'num': 100, 'color': 'blue'},
        {'size': 'L', 'num': 100, 'color': 'green'}
      ]
    },
    {
      '_id': '52350353b2eff1353b349de9',
      'code': 'ijk',
      'tags': ['electronics', 'school'],
      'qty': [
        {'size': 'M', 'num': 100, 'color': 'green'}
      ]
    }
  ]
  var q = new Mingo.Query({
    qty: {
      $all: [
        {'$elemMatch': {size: 'M', num: {$gt: 50}}},
        {'$elemMatch': {num: 100, color: 'green'}}
      ]
    }
  })

  var result = true
  data.forEach(function (obj) {
    result = result && q.test(obj)
  })

  t.ok(result, 'can match object using $all with $elemMatch')

  data = [{
    key0: [{
      key1: [[[{key2: [{a: 'value2'}, {a: 'dummy'}, {b: 20}]}]], {'key2': 'value'}],
      key1a: {key2a: 'value2a'}
    }]
  }]

  var fixtures = [
    [{'key0.key1.key2.a': 'value2'}, [], 'should not match without array index selector to nested value '],
    [{'key0.key1.0.key2.a': 'value2'}, [], 'should not match without enough depth for array index selector to nested value'],
    [{'key0.key1.0.0.key2.a': 'value2'}, data, 'should match with full array index selector to deeply nested value'],
    [{'key0.key1.0.0.key2': {b: 20}}, data, 'should match with array index selector to nested value at depth 1'],
    [{'key0.key1.1.key2': 'value'}, data, 'should match with full array index selector to nested value'],
    [{'key0.key1.key2': 'value'}, data, 'should match without array index selector to nested value at depth 1'],
    [{'key0.key1.1.key2': 'value'}, data, 'should match shallow nested value with array index selector']
  ]

  fixtures.forEach(function (row) {
    var query = row[0],
      expected = row[1],
      message = row[2]

    var result = Mingo.find(data, query).all()
    t.deepEqual(result, expected, message)
  })

  fixtures = [
    [{'key0.key1': [[{key2: [{a: 'value2'}, {a: 'dummy'}, {b: 20}]}]]}, 'should match full key selector'],
    [{'key0.key1.0': [[{key2: [{a: 'value2'}, {a: 'dummy'}, {b: 20}]}]]}, 'should match with key<-->index selector'],
    [{'key0.key1.0.0': [{key2: [{a: 'value2'}, {a: 'dummy'}, {b: 20}]}]}, 'should match with key<-->multi-index selector'],
    [{'key0.key1.0.0.key2': [{a: 'value2'}, {a: 'dummy'}, {b: 20}]}, 'should match with key<-->multi-index<-->key selector']
  ]

  // should match whole objects
  fixtures.forEach(function (row) {
    var query = row[0], message = row[1]
    var result = Mingo.find(data, query).all()
    t.deepEqual(result, data, message)
  })

  t.end()
})
