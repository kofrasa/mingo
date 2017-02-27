var test = require('tape')
var samples = require('./samples')
var Mingo = require('../mingo')

test('Custom Operators', function (t) {
  t.test('custom pipeline operator', function (t) {
    t.plan(1)

    Mingo.addOperators(Mingo.OP_PIPELINE, function (m) {
      return {
        '$pluck': function (collection, expr) {
          return collection.map(function (item) {
            return m.resolve(item, expr)
          })
        }
      }
    })

    var result = Mingo.aggregate(samples.gradesComplex, [{$unwind: '$scores'}, {$pluck: 'scores.score'}])
    t.ok(typeof result[0] === 'number', 'can add new pipeline operator')
  })

  t.test('custom query operator', function (t) {
    t.plan(2)

    Mingo.addOperators(Mingo.OP_QUERY, function () {
      return {
        '$between': function (selector, value, args) {
          return value >= args[0] && value <= args[1]
        }
      }
    })

    var coll = [{a: 1, b: 1}, {a: 7, b: 1}, {a: 10, b: 6}, {a: 20, b: 10}]
    var result = Mingo.find(coll, {a: {'$between': [5, 10]}}, null).all()
    t.equal(2, result.length, 'can add new query operator')

    try {
      Mingo.addOperators(Mingo.OP_QUERY, function () {
        return {
          '$between': function (selector, value, args) {
            var query = {}
            query[selector] = {$gte: args[0], $lte: args[1]}
            return new Mingo.Query(query)
          }
        }
      })
    } catch (e) {
      t.ok(true, 'cannot override existing operators')
    }
  })

  t.test('custom group operator', function (t) {
    t.plan(2)
    Mingo.addOperators(Mingo.OP_GROUP, function (m) {
      return {
        '$stddev': function (collection, expr) {
          var result = Mingo.aggregate(collection, [{$group: {avg: {$avg: expr}}}])
          var avg = result[0].avg
          var diffs = collection.map(function (item) {
            var v = m.computeValue(item, expr) - avg
            return v * v
          })
          var variance = diffs.reduce(function (memo, val) {
            return memo + val
          }, 0) / diffs.length
          return Math.sqrt(variance)
        }
      }
    })
    result = Mingo.aggregate(samples.gradesComplex, [{$unwind: '$scores'}, {$group: {stddev: {$stddev: '$scores.score'}}}])
    t.ok(result.length === 1, 'must return one result after grouping')
    t.equal(28.57362029450366, result[0].stddev, 'must return correct stddev')
  })
})
