import fs from 'fs'
import test from 'tape'
import mingo from '../lib'
import { computeValue } from '../lib/core'

mingo.enableSystemOperators()

export const personData = JSON.parse(fs.readFileSync(__dirname + '/data/person.json'))
export const simpleGradesData = JSON.parse(fs.readFileSync(__dirname + '/data/grades_simple.json'))
export const complexGradesData = JSON.parse(fs.readFileSync(__dirname + '/data/grades_complex.json'))
export const studentsData = JSON.parse(fs.readFileSync(__dirname + '/data/students.json'))

export const groupByObjectsData = [
  {'date_buckets': {'date': '2015-04-29T00:17:03.107Z', 'day': 28, 'hour': 18, 'minute': 17, 'sec': 3, 'hour_minute': '18:17'}, 'Keyword ID': 'sr3_4VzRD3sp', 'Creative ID': '5184986203', 'Keyword': 'Bathroom Cleaning Tips', 'Match Type': 'be', 'Device': 'm', 'Conversions': [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], 'Revenues': [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], 'account_id': 'baron'},
  {'date_buckets': {'date': '2015-04-29T00:17:03.107Z', 'day': 28, 'hour': 18, 'minute': 17, 'sec': 3, 'hour_minute': '18:17'}, 'Keyword ID': 'sr3_K1iQOeXy', 'Creative ID': '5184986241', 'Keyword': 'Cleaning Bathroom Tips', 'Match Type': 'bb', 'Device': 'c', 'Conversions': [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0], 'Revenues': [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0], 'account_id': 'baron'},
  {'date_buckets': {'date': '2015-04-29T00:17:03.108Z', 'day': 28, 'hour': 18, 'minute': 17, 'sec': 3, 'hour_minute': '18:17'}, 'Keyword ID': 'sr3_sl0C3VAYk', 'Creative ID': '44210589597', 'Keyword': 'best way to clean a bathroom', 'Match Type': 'b', 'Device': 'c', 'Conversions': [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0], 'Revenues': [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0], 'account_id': 'baron'},
  {'date_buckets': {'date': '2015-04-29T00:17:03.108Z', 'day': 28, 'hour': 18, 'minute': 17, 'sec': 3, 'hour_minute': '18:17'}, 'Keyword ID': 'sr3_4VzRD3sp', 'Creative ID': '5184986204', 'Keyword': 'Bathroom Cleaning Tips', 'Match Type': 'be', 'Device': 'c', 'Conversions': [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], 'Revenues': [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], 'account_id': 'baron'},
  {'date_buckets': {'date': '2015-04-29T00:17:03.107Z', 'day': 28, 'hour': 18, 'minute': 17, 'sec': 3, 'hour_minute': '18:17'}, 'Keyword ID': 'sr3_HZAarvKy', 'Creative ID': '6074827333', 'Keyword': 'Drain Clogs', 'Match Type': 'bp', 'Device': 'c', 'Conversions': [1, 0, 0, 1, 0, 0, 0, 0, 0], 'Revenues': [5, 0, 0, 5, 0, 0, 0, 0, 0], 'account_id': 'baron'},
  {'date_buckets': {'date': '2015-04-29T00:17:03.107Z', 'day': 28, 'hour': 18, 'minute': 17, 'sec': 3, 'hour_minute': '18:17'}, 'Keyword ID': 'sr3_irU8fFk0', 'Creative ID': '6074827289', 'Keyword': 'unclog bathtub drain', 'Match Type': 'bp', 'Device': 'c', 'Conversions': [1, 0, 0, 1, 0, 0, 0, 0, 0], 'Revenues': [5, 0, 0, 5, 0, 0, 0, 0, 0], 'account_id': 'baron'}
]

export function runTest(description, suite) {
  Object.entries(suite).forEach(function (arr) {
    let operator = arr[0]
    let examples = arr[1]
    test(description + ': ' + operator, function (t) {
      examples.forEach(function (val) {
        let input = val[0]
        let expected = val[1]
        let ctx = val[2] || { err: false }
        let obj = ctx.obj || {}

        let field = operator
        // use the operator as field if not present in input
        if (!!input && input.constructor === Object) {
          field = Object.keys(input).find((s) => s[0] === '$') || null
          if (field === null) {
            field = operator
          } else {
            input = input[field]
          }
        }

        if (ctx.err) {
          t.throws(() => computeValue(obj, input, field), JSON.stringify(input) + '\t=>\t' + expected)
        } else {
          let actual = computeValue(obj, input, field)
          let message =  operator + ':\t' + JSON.stringify(input) + '\t=>\t' + JSON.stringify(expected)
          // NaNs don't compare
          if (actual !== actual && expected !== expected) actual = expected = 0
          t.deepEqual(actual, expected, message)
        }
      })
      t.end()
    })
  })
}

/**
 * run pipeline test
 */
export function runTestPipeline(description, suite) {
  test(description, function (t) {
    suite.forEach(function (unitTest) {
      let input = unitTest.input
      let pipeline = unitTest.query
      let check = unitTest.check
      let message = unitTest.message || "actual equals expected"
      let actual = mingo.aggregate(input, pipeline)
      if (typeof check === 'function') {
        check(actual, t)
      } else {
        t.deepEqual(actual, check, message)
      }
    })
    t.end()
  })
}
