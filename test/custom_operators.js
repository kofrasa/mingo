import test from 'tape'
import * as support from './support'
import * as mingo from '../lib'
let OperatorType = mingo.OperatorType


test('Custom Operators', function (t) {
  t.test('custom pipeline operator', function (t) {
    t.plan(1)

    mingo.addOperators(OperatorType.PIPELINE, function (m) {
      return {
        '$pluck': function (collection, expr) {
          let agg = new mingo.Aggregator([ { '$project': { '__temp__': expr } } ])
          return agg.stream(collection).map(function (item) {
            return item['__temp__']
          })
        }
      }
    })

    let result = mingo.aggregate(support.complexGradesData, [{$unwind: '$scores'}, {$pluck: '$scores.score'}])
    t.ok(typeof result[0] === 'number', 'can add new pipeline operator')
  })

  t.test('custom query operator', function (t) {
    t.plan(2)

    mingo.addOperators(OperatorType.QUERY, function () {
      return {
        '$between': function (selector, value, args) {
          return value >= args[0] && value <= args[1]
        }
      }
    })

    let coll = [{a: 1, b: 1}, {a: 7, b: 1}, {a: 10, b: 6}, {a: 20, b: 10}]
    let result = mingo.find(coll, {a: {'$between': [5, 10]}}, null).all()
    t.equal(2, result.length, 'can add new query operator')

    try {
      mingo.addOperators(OperatorType.QUERY, function () {
        return {
          '$between': function (selector, value, args) {
            let query = {}
            query[selector] = {$gte: args[0], $lte: args[1]}
            return new mingo.Query(query)
          }
        }
      })
    } catch (e) {
      t.ok(true, 'cannot override existing operators')
    }
  })

  t.test('custom accumulator operator', function (t) {
    t.plan(2)
    mingo.addOperators(OperatorType.ACCUMULATOR, function (m) {
      return {
        '$stddev': function (collection, expr) {
          let result = mingo.aggregate(collection, [{$group: {avg: {$avg: expr}}}])
          let avg = result[0].avg
          let diffs = collection.map(function (item) {
            let v = m.computeValue(item, expr) - avg
            return v * v
          })
          let variance = diffs.reduce(function (memo, val) {
            return memo + val
          }, 0) / diffs.length
          return Math.sqrt(variance)
        }
      }
    })
    let result = mingo.aggregate(support.complexGradesData, [{$unwind: '$scores'}, {$group: {stddev: {$stddev: '$scores.score'}}}])
    t.ok(result.length === 1, 'must return one result after grouping')
    t.equal(28.57362029450366, result[0].stddev, 'must return correct stddev')
  })
})
