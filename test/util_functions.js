var test = require('tape')
var mingo = require('../es5')
var _ = mingo._internal()

function pp(v) { console.log(JSON.stringify(v)) }

// TODO: add some more tests
test('Test isEqual', function (t) {
  var sample = [
    [NaN, 0 / 0, true],
    [NaN, NaN, true],
    [0, -0, true],
    [-0, 0, true],
    [1, NaN, false],
    [NaN, 1, false],
    [[1, 2], [1, 2], true],
    [[2, 1], [1, 2], false],
    [[1, 'a', {a: /b/}], [1, 'a', {a: new RegExp('b')}], true],
    [null, undefined, false],
    [new Date(2003, 10, 1), new Date(2003, 10, 1), true],
    [{date: {year: 2013, month: 9, day: 25}}, {date: {year: 2013, month: 9, day: 25}}, true],
    [function () {}, function () {}, false],
    [Object.prototype.toString, Object.prototype.toString, true]
  ]
  var b = true
  sample.forEach(function (arr) {
    b = b && (_.isEqual(arr[0], arr[1]) === arr[2])
    if (!b) t.ok(false, "failed test: " + JSON.stringify(arr[0]) + " = " + JSON.stringify(arr[1]))
  })
  t.ok(true, "all pass")
  t.end()
})

test('Test resolve()', function (t) {

  var input = {_id: 'some-id', l1: [{l2: [{ l3: 'level3', l3bis: 'level3bis'}]}, {l2bis: 'level2bis'}]}
  t.deepEqual(_.resolve(input, 'l1.l2.l3'), [['level3']])

  var data = {l1: {l2: [{l3: [{ a: 666}, {a: false}, {a: undefined}]}, {l4: 'some prop'}, {a: false}]}}
  t.deepEqual(_.resolve(data, 'l1.l2.l4'), ['some prop'] , "should resolve existing single nested value")
  t.deepEqual(_.resolve(data, 'l1.l2.l3.a'), [[666, false]] , "should resolve all existing nested values")

  data = {
    key0: [{
      key1: [[[{key2: [{a: 'value2'}, {a: 'dummy'}, {b: 20}]}]], {'key2': 'value'}],
      key1a: {key2a: 'value2a'}
    }]
  }
  //pp(_.resolve(data, 'key0.key1.0'))
  //pp(_.resolve(data, 'key0.key1.0.0.key2'))

  data = { "key0" : [ { "key1" : [ "value" ] }, { "key1" : [ "value1" ] } ] }
  t.deepEqual(_.resolve(data, 'key0.key1'), [['value'], ['value1']])
  t.end()
})

