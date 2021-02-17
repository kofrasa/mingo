import test from 'tape'
import { isEqual, sortBy, isObject,isEmpty } from '../lib/util'

test('Test isEqual', function (t) {
  let sample = [
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
  let b = true
  sample.forEach(function (arr) {
    let r = isEqual(arr[0], arr[1])
    b = b && (r === arr[2])
    if (!b) t.ok(false, "failed test: " + JSON.stringify(arr[0]) + " = " + JSON.stringify(arr[1]))
  })
  t.ok(true, "all pass")
  t.end()
})

test('sortBy util', function (t) {
  t.deepEqual(
    sortBy(['c', 'a', 'function', 'constructor'], k => k),
    ['a', 'c', 'constructor', 'function'],
    "can sort by 'constructor' key"
  )
  t.end()
})

test('Test isObject', (t) => {
  function Foo() {
    this.a = 'foo'
  }

  const OBJECT_PROTO = Object.getPrototypeOf({})

  let arrayWithNullProto = new Array('a', 'b')
  Object.setPrototypeOf(arrayWithNullProto, null)

  let arrayWithObjectProto = new Array('a', 'b')
  Object.setPrototypeOf(arrayWithObjectProto, OBJECT_PROTO)

  let fooWithNullProto = new Foo()
  Object.setPrototypeOf(fooWithNullProto, null)

  let fooWithObjectProto = new Foo()
  Object.setPrototypeOf(fooWithObjectProto, OBJECT_PROTO)

  let fixtures = [
    [{}, true, 'empty object literal'],
    [{a: 1}, true, 'object literal with value'],
    [Object.create(null), true, 'object from null proto'],
    [Object.create(OBJECT_PROTO), true, 'object from object proto'],
    [fooWithNullProto, true, 'custom type with null proto'],
    [fooWithObjectProto, true, 'custom type with object proto'],
    [arrayWithObjectProto, false, 'array with object proto'],
    [arrayWithNullProto, false, 'array with null proto'],
    [Object.create({}), false, 'object with object literal as proto'],
    [new Array(3,2,1), false, 'array instance'],
    [new Foo(), false, 'custom object instance'],
  ]

  fixtures.forEach((arr) => {
    t.equal(isObject(arr[0]), arr[1], arr[2])
  })

  t.end()
})


test('isEmpty util', function (t) {
  let sample = ['0',0,null,{},'',[]]
  t.deepEqual(sample.map(x=>isEmpty(x)),[false,false,true,true,true,true],"pass test")
  t.end()
})
