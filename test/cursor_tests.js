import test from 'tape'
import mingo from '../lib'
import * as samples from './support'


test('Cursor tests', function (t) {
  // create a query with no criteria
  let query = new mingo.Query({})
  function newCursor() {
    return query.find(samples.simpleGradesData)
  }

  let cursor = newCursor()
  cursor.skip(10).limit(10)
  t.equal(cursor.hasNext(), true, 'can peek for an item with hasNext()')
  t.ok(cursor.next(), 'can select next item with next()')
  t.equal(cursor.count(), 9, 'can count items with count()') // cursor.next consumes 1
  t.equal(cursor.hasNext(), false, 'can peek for an item with hasNext()')

  cursor = newCursor()
  cursor.forEach(x => x)

  cursor = newCursor()
  cursor.map(x => typeof x).every(x => typeof x === 'boolean')
  t.end()
})
