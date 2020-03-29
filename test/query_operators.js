var test = require('tape')
var mingo = require('../es5/')

var samples = require('./support')

var idStr = "123456789abe"
var obj = samples.personData
obj['_id'] = new ObjectId(idStr)
obj['today'] = new Date()

// test configurations
mingo.setup({
  'key': '_id'
})

function ObjectId(id) {
  this._id = id
}

test('Comparison, Evaluation, and Element Operators', function (t) {
  var queries = [
    [{_id: new ObjectId(idStr)}, 'can match against user-defined types'],
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
    [{middlename: {$in: [null, 'David']}}, 'can check if value does not exist with $in'],
    [{'circles.family': {$nin: ['Pamela']}}, 'can check that value is not in array with $nin'],
    [{firstName: {$nin: [null]}}, 'can check if value exists with $nin'],
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
    var query = new mingo.Query(q[0])
    t.ok(query.test(obj), q[1])
  })

  //https://github.com/kofrasa/mingo/issues/54
  var data = [{ _id: 1, item: null }, { _id: 2 }]
  var result = mingo.find(data, {item: null}).all()
  t.deepEqual(result, data, "can match null and missing types correctly")

  t.end()
})

test('project $type operator', function (t) {
  var obj = {
    double: 12323.4,
    string: "me",
    obj: {},
    array: [],
    boolean: true,
    date: new Date(),
    nothing: null,
    regex: /ab/,
    int: 49023,
    long: Math.pow(2,32),
    decimal: 20.7823e10
  }
  var queries = [
    [{double: {$type: 1}}, 'can match $type 1 "double"'],
    [{string: {$type: 2}}, 'can match $type 2 "string"'],
    [{obj: {$type: 3}}, 'can match $type 3 "object"'],
    [{array: {$type: 4}}, 'can match $type 4 "array"'],
    [{missing: {$type: 6}}, 'can match $type 6 "undefined"'],
    [{boolean: {$type: 8}}, 'can match $type 8 "boolean"'],
    [{date: {$type: 9}}, 'can match $type 9 "date"'],
    [{nothing: {$type: 10}}, 'can match $type 10 "null"'],
    [{regex: {$type: 11}}, 'can match $type 11 "regexp"'],
    [{int: {$type: 16}}, 'can match $type 16 "int"'],
    [{long: {$type: 18}}, 'can match $type 18 "long"'],
    [{decimal: {$type: 19}}, 'can match $type 19 "decimal"'],
    [{obj: {$not: {$type: 100}}}, 'do not match unknown $type']
  ]

  queries.forEach(function (q) {
    var query = new mingo.Query(q[0])
    t.ok(query.test(obj), q[1])
  })

  t.end()
})


test('Match $all with $elemMatch on nested elements', function (t) {
  t.plan(1)

  var data = [
    {
      user: {
        username: 'User1',
        projects: [
          {name: 'Project 1', rating: {complexity: 6}},
          {name: 'Project 2', rating: {complexity: 2}}
        ]
      }
    },
    {
      user: {
        username: 'User2',
        projects: [
          {name: 'Project 1', rating: {complexity: 6}},
          {name: 'Project 2', rating: {complexity: 8}}
        ]
      }
    }
  ]
  var criteria = {
    'user.projects': {'$all': [ {'$elemMatch': {'rating.complexity': {'$gt': 6}}} ]}
  }
  // It should return one user object
  var result = mingo.find(data, criteria).count()
  t.ok(result === 1, 'can match using $all with $elemMatch on nested elements')
})

test('Projection $elemMatch operator', function (t) {
  var data = [
    {
      _id: 1,
      zipcode: "63109",
      students: [
        { name: "john", school: 102, age: 10 },
        { name: "jess", school: 102, age: 11 },
        { name: "jeff", school: 108, age: 15 }
      ]
    },
    {
      _id: 2,
      zipcode: "63110",
      students: [
        { name: "ajax", school: 100, age: 7 },
        { name: "achilles", school: 100, age: 8 }
      ]
    },
    {
      _id: 3,
      zipcode: "63109",
      students: [
        { name: "ajax", school: 100, age: 7 },
        { name: "achilles", school: 100, age: 8 }
      ]
    },
    {
      _id: 4,
      zipcode: "63109",
      students: [
        { name: "barney", school: 102, age: 7 },
        { name: "ruth", school: 102, age: 16 }
      ]
    }
  ]

  var result = mingo.find(data, { zipcode: "63109" }, { students: { $elemMatch: { school: 102 } } } ).all()
  t.deepEqual(result, [
    { "_id" : 1, "students" : [ { "name" : "john", "school" : 102, "age" : 10 } ] },
    { "_id" : 3 },
    { "_id" : 4, "students" : [ { "name" : "barney", "school" : 102, "age" : 7 } ] }
  ], 'can project with $elemMatch')

  result = mingo.find(data, { zipcode: "63109" }, { students: { $elemMatch: { school: 102, age: { $gt: 10} } } } ).all()
  t.deepEqual(result, [
    { "_id" : 1, "students" : [ { "name" : "jess", "school" : 102, "age" : 11 } ] },
    { "_id" : 3 },
    { "_id" : 4, "students" : [ { "name" : "ruth", "school" : 102, "age" : 16 } ] }
  ], 'can project multiple fields with $elemMatch')

  result = mingo.find(data, { }, { students: {$slice: 1 } } ).all()[0]
  t.equal(result.students.length, 1, 'can project with $slice')

  t.end()

})

test('Query $elemMatch operator', function (t) {
  var result = mingo.find([
    { _id: 1, results: [ 82, 85, 88 ] },
    { _id: 2, results: [ 75, 88, 89 ] }
  ], { results: { $elemMatch: { $gte: 80, $lt: 85 } } }).all()[0]

  t.deepEqual(result, { "_id" : 1, "results" : [ 82, 85, 88 ] }, 'simple $elemMatch query')

  var products = [
    { _id: 1, results: [ { product: "abc", score: 10 }, { product: "xyz", score: 5 } ] },
    { _id: 2, results: [ { product: "abc", score: 8 }, { product: "xyz", score: 7 } ] },
    { _id: 3, results: [ { product: "abc", score: 7 }, { product: "xyz", score: 8 } ] }
  ]
  result = mingo.find(products, { results: { $elemMatch: { product: "xyz", score: { $gte: 8 } } } }).all()[0]

  t.deepEqual(
    result,
    { "_id" : 3, "results" : [ { "product" : "abc", "score" : 7 }, { "product" : "xyz", "score" : 8 } ] },
    '$elemMatch on embedded documents'
  )

  result = mingo.find(products, { results: { $elemMatch: { product: "xyz" } } }).all()
  t.deepEqual(result, products, '$elemMatch single document')

  // Test for https://github.com/kofrasa/mingo/issues/103
  var fixtures = [
    [ { $eq: 50 } ],
    [ { $lt: 50 } ],
    [ { $lte: 50 } ],
    [ { $gt: 50 } ],
    [ { $gte: 50 } ]
  ]

  fixtures.forEach(function (args) {
    let query = new mingo.Query({ scores: { $elemMatch: args[0] } })
    let op = Object.keys(args[0])[0]
    // test if an object matches query
    t.ok(query.test({ scores: [10, 50, 100] }), "$elemMatch: should filter with " + op)
  })

  t.end()
})

test('Evaluate $where last', function (t) {
  t.plan(2)

  var data = [
    {
      user: {
        username: 'User1',
        projects: [
          {name: 'Project 1', rating: {complexity: 6}},
          {name: 'Project 2', rating: {complexity: 2}}
        ],
        color: 'green',
        number: 42
      }
    },
    {
      user: {
        username: 'User2',
        projects: [
          {name: 'Project 1', rating: {complexity: 6}},
          {name: 'Project 2', rating: {complexity: 8}}
        ]
      }
    }
  ]

  var criteria = {
    'user.color': {$exists: true},
    'user.number': {$exists: true},
    $where: 'this.user.color === "green" && this.user.number === 42'
  }
  // It should return one user object
  var result = mingo.find(data, criteria).count()
  t.ok(result === 1, 'can safely reference properties on this using $where and $exists')

  criteria = {
    'user.color': {$exists: true},
    'user.number': {$exists: true},
    $and: [
      { $where: 'this.user.color === "green"' },
      { $where: 'this.user.number === 42' }
    ]
  }
  // It should return one user object
  var result = mingo.find(data, criteria).count()
  t.ok(result === 1, 'can safely reference properties on this using multiple $where operators and $exists')
})

test('Query projection operators', function (t) {
  var data = [obj]
  var result = mingo.find(data, {}, {'languages.programming': {$slice: [-3, 2]}}).next()
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

  result = mingo.find(data, {'key0.key1.key2': 'value'}, {'key0.key1.key2.a': 1}).next()
  t.deepEqual(result, expected, 'should project only selected object graph from nested arrays')
  t.notDeepEqual(data[0], result, 'should not modify original')

  data = [ { 'name': 'Steve', 'age': 15, 'features': { 'hair': 'brown', 'eyes': 'brown' } } ]
  result = mingo.find(data, {}, { 'features.hair': 1 }).next()
  t.deepEqual(result, {'features': {hair: 'brown'}}, 'should project only selected object graph')
  t.notDeepEqual(data[0], result, 'should not modify original')

  t.throws(function () {
    mingo.find(data, {}, { 'features.hair': 0, 'name': 1 }).next()
  }, Error, 'should throw exception: Projection cannot have a mix of inclusion and exclusion')

  result = mingo.find(data, {}, { 'features.hair': 0}).next()
  t.deepEqual(result, {'name': 'Steve', 'age': 15, 'features': {'eyes': 'brown'}}, 'should omit key')
  t.notDeepEqual(data[0], result, 'should not modify original')

  data = [{ 'name': 'Steve', 'age': 15, 'features': ['hair', 'eyes', 'nose']} ]
  result = mingo.find(data, {}, { 'features.1': 0}).next()
  t.deepEqual(result, {'name': 'Steve', 'age': 15, 'features': ['hair', 'nose']}, 'should omit second element in array')
  t.notDeepEqual(data[0], result, 'should not modify original')

  result = mingo.find(data, {}, { 'features.1': 1}).next()
  t.deepEqual(result, {'features': ['eyes']}, 'should select only second element in array')
  t.notDeepEqual(data[0], result, 'should not modify original')

  result = mingo.find([
    { id: 1, sub: [{ id: 11, name: 'OneOne', test: true }] },
    { id: 2, sub: [{ id: 22, name: 'TwoTwo', test: false }] }
  ], {}, { 'sub.id': 1, 'sub.name': 1 }).next()
  t.deepEqual(result, { "sub" : [ { "id" : 11, "name" : "OneOne" } ] }, 'should project nested elements in array')

  t.end()
})

test('Logical Operators', function (t) {
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
      t.ok(new mingo.Query(q[0]).test(obj), q[1])
    } else if (q.length === 3) {
      t.equal(new mingo.Query(q[0]).test(obj), q[1], q[2])
    }
  })

  t.end()
})

test('Query array operators', function (t) {
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
  var q = new mingo.Query({
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

    var result = mingo.find(data, query).all()
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
    var result = mingo.find(data, query)

    // using iterator
    t.deepEqual(Array.from(result), data, message)
    t.ok(Array.from(result).length === 0, "iterator should be empty")
  })

  // https://github.com/kofrasa/mingo/issues/51
  data = [{ "key0" : [ { "key1" : [ "value" ] }, { "key1" : [ "value1" ] } ] }]
  result = mingo.find(data, { "key0.key1": { "$eq": "value" } }).next()
  t.deepEqual(result, data[0], "should match nested array of objects without indices")

  // https://github.com/kofrasa/mingo/issues/93
  data = [{
    id: 1,
    sub: [
      { id: 11, name: 'OneOne', test: true },
      { id: 22, name: 'TwoTwo', test: false }
    ]
  }]

  result = mingo.find(data, {}, { 'sub.id': 1, 'sub.name': 1 }).all()
  t.deepEqual(result, [
    { sub: [ { id: 11, name: 'OneOne' }, { id: 22, name: 'TwoTwo' } ] }
  ], "should project all matched elements of nested array")

  // https://github.com/kofrasa/mingo/issues/105 - fix merging distinct objects during projection
  var result = mingo.find([ { items: [ { from: 1 }, { to: 2 } ] } ], {}, { 'items.from': 1, 'items.to': 1 }).all();
  t.deepEqual(result, [ { items: [ { from: 1 }, { to: 2 } ] } ], "should project multiple nested elements")

  // extended test for missing keys of nested values
  var result = mingo.find([ { items: [ { from: 1, to: null }, { to: 2 } ] } ], {}, { 'items.from': 1, 'items.to': 1 }).all();
  t.deepEqual(result, [ { items: [ { from: 1, to: null }, { to: 2 } ] } ], "project multiple nested elements with missing keys")

  // https://github.com/kofrasa/mingo/issues/106 - fix nested elements splitting after projection due to out of order matching
  result = mingo.find(
    [ { history: [ { "user" : "Jeff", "notes" : "asdf"}, { "user" : "Gary" } ] } ],
    {},
    {
      'history.user' : 1,
      'history.notes' : 1
    }
  ).all()

  t.deepEqual(result, [
    {
      history: [
        {
            "user" : "Jeff",
            "notes" : "asdf"
        }, {
            "user" : "Gary",
        }
      ]
    }
  ], "project multiple nested objects with missing keys and matched out of order")

  t.end()
})

test('$regex test', function (t) {

  // no regex - returns expected list: 1 element - ok
  var res = []
  res.push(mingo.find([{l1: [{ tags: ['tag1', 'tag2'] }, {'notags': 'yep'}]}], {'l1.tags': 'tag1'}).all())

  // with regex - but searched property is not an array: ok
  res.push(mingo.find([{l1: [{ tags: 'tag1'}, {'notags': 'yep'}]}], {'l1.tags': {$regex: '.*tag.*', $options: 'i'}}).all())

  // with regex - but searched property is an array, with all elements matching: not ok - expected 1, returned 0
  res.push(mingo.find([{l1: [{ tags: ['tag1', 'tag2'] }, {'tags': ['tag66']}]}], {'l1.tags': {$regex: 'tag', $options: 'i'}}).all())

  // with regex - but searched property is an array, only one element matching: not ok - returns 0 elements - expected 1
  res.push(mingo.find([{l1: [{ tags: ['tag1', 'tag2'] }, {'notags': 'yep'}]}], {'l1.tags': {$regex: 'tag', $options: 'i'}}).all())

  t.ok(res.every((x) => x.length === 1), 'can $regex match nested values')

  t.end()
})

test('$expr tests', function (t) {
  // https://docs.mongodb.com/manual/reference/operator/query/expr/

  var res = mingo.find([
      { "_id" : 1, "category" : "food", "budget": 400, "spent": 450 },
      { "_id" : 2, "category" : "drinks", "budget": 100, "spent": 150 },
      { "_id" : 3, "category" : "clothes", "budget": 100, "spent": 50 },
      { "_id" : 4, "category" : "misc", "budget": 500, "spent": 300 },
      { "_id" : 5, "category" : "travel", "budget": 200, "spent": 650 }
    ],
    { $expr: { $gt: [ "$spent" , "$budget" ] } }
  ).all()

  t.deepEqual(res, [
    { "_id" : 1, "category" : "food", "budget" : 400, "spent" : 450 },
    { "_id" : 2, "category" : "drinks", "budget" : 100, "spent" : 150 },
    { "_id" : 5, "category" : "travel", "budget" : 200, "spent" : 650 }
  ], "compare two fields from a single document")

  res = mingo.find([
    { "_id" : 1, "item" : "binder", "qty": 100 , "price": 12 },
    { "_id" : 2, "item" : "notebook", "qty": 200 , "price": 8 },
    { "_id" : 3, "item" : "pencil", "qty": 50 , "price": 6 },
    { "_id" : 4, "item" : "eraser", "qty": 150 , "price": 3 }
  ], {
    $expr: {
       $lt:[ {
          $cond: {
             if: { $gte: ["$qty", 100] },
             then: { $divide: ["$price", 2] },
             else: { $divide: ["$price", 4] }
           }
       },
       5 ] }
  }).all()

  t.deepEqual(res, [
    { "_id" : 2, "item" : "notebook", "qty": 200 , "price": 8 },
    { "_id" : 3, "item" : "pencil", "qty": 50 , "price": 6 },
    { "_id" : 4, "item" : "eraser", "qty": 150 , "price": 3 }
  ], "using $expr with conditional statements")

  t.end()
})

test('null or missing fields', function (t) {
  var data = [ { _id: 1, item: null }, { _id: 2 } ]
  var fixtures = [
    // query, result, message
    [ { item: null }, [ { _id: 1, item: null }, { _id: 2 } ], 'should return all documents' ],
    [ { item : { $type: 10 } }, [ { _id: 1, item: null } ], 'should return one document with null field' ],
    [ { item : { $exists: false } }, [ { _id: 2 } ], 'should return one document without null field' ],
    [ { item : { $in: [null, false] } }, [ { _id: 1, item: null }, { _id: 2 } ], '$in should return all documents' ],
  ]
  for (var i = 0; i < fixtures.length; i++) {
    var arr = fixtures[i]
    var res = mingo.find(data, arr[0]).all()
    t.deepEqual(res, arr[1], arr[2])
  }
  t.end()
})