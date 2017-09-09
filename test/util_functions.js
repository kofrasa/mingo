var test = require('tape')
var mingo = require('../dist/mingo')
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
  sample.forEach(function (arr) {
    t.equal(_.isEqual(arr[0], arr[1]), arr[2])
  })
  t.end()
})

test('Test resolve()', function (t) {

  //var input = {_id: 'some-id', l1: [{l2: [{ l3: 'level3', l3bis: 'level3bis'}]}, {l2bis: 'level2bis'}]}
  //var res = mingo.aggregate([input], [{$project: { l3: '$l1.l2.l3'}}])
  //pp(res)

  // pp(_.computeValue(input, '$l1.l2.l3', 'l3'))
  // pp(_.resolveObj(input, 'l1.l2.l3'))
  // pp(_.resolveObj(input, 'l3'))

  var data = {l1: {l2: [{l3: [{ a: 666}, {a: false}, {a: undefined}]}, {l4: 'some prop'}, {a: false}]}}
  t.deepEqual(_.resolve(data, 'l1.l2.l4'), 'some prop' , "should resolve existing single nested value")
  t.deepEqual(_.resolve(data, 'l1.l2.l3.a'), [666, false] , "should resolve all existing nested values")
  t.end()
})

