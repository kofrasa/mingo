var test = require('tape')
var mingo = require('../es5')
var samples = require('./support')
var _ = mingo._internal()

test('Mingo.Cursor tests', function (t) {
  // create a query with no criteria
  var query = new mingo.Query({})
  function newCursor() {
    return query.find(samples.simpleGradesData)
  }

  var cursor = newCursor()
  cursor.skip(10).limit(10)
  t.equal(cursor.hasNext(), true, 'can peek for an item with hasNext()')
  t.ok(cursor.next(), 'can select next item with next()')
  t.equal(cursor.count(), 9, 'can count items with count()') // cursor.next consumes 1
  t.equal(cursor.hasNext(), false, 'can peek for an item with hasNext()')

  cursor = newCursor()
  cursor.forEach(_.isObject)

  cursor = newCursor()
  cursor.map(_.isObject).every(_.isBoolean)
  t.end()
})
