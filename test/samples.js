var fs = require('fs')
var test = require('tape')
var Mingo = require('../mingo')
var _ = Mingo._internal()

exports.person = JSON.parse(fs.readFileSync(__dirname + '/data/person.json'))
exports.gradesSimple = JSON.parse(fs.readFileSync(__dirname + '/data/grades_simple.json'))
exports.gradesComplex = JSON.parse(fs.readFileSync(__dirname + '/data/grades_complex.json'))
exports.students = JSON.parse(fs.readFileSync(__dirname + '/data/students.json'))

exports.groupByObjectsData = [
  {'date_buckets': {'date': '2015-04-29T00:17:03.107Z', 'day': 28, 'hour': 18, 'minute': 17, 'sec': 3, 'hour_minute': '18:17'}, 'Keyword ID': 'sr3_4VzRD3sp', 'Creative ID': '5184986203', 'Keyword': 'Bathroom Cleaning Tips', 'Match Type': 'be', 'Device': 'm', 'Conversions': [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], 'Revenues': [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], 'account_id': 'baron'},
  {'date_buckets': {'date': '2015-04-29T00:17:03.107Z', 'day': 28, 'hour': 18, 'minute': 17, 'sec': 3, 'hour_minute': '18:17'}, 'Keyword ID': 'sr3_K1iQOeXy', 'Creative ID': '5184986241', 'Keyword': 'Cleaning Bathroom Tips', 'Match Type': 'bb', 'Device': 'c', 'Conversions': [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0], 'Revenues': [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0], 'account_id': 'baron'},
  {'date_buckets': {'date': '2015-04-29T00:17:03.108Z', 'day': 28, 'hour': 18, 'minute': 17, 'sec': 3, 'hour_minute': '18:17'}, 'Keyword ID': 'sr3_sl0C3VAYk', 'Creative ID': '44210589597', 'Keyword': 'best way to clean a bathroom', 'Match Type': 'b', 'Device': 'c', 'Conversions': [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0], 'Revenues': [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0], 'account_id': 'baron'},
  {'date_buckets': {'date': '2015-04-29T00:17:03.108Z', 'day': 28, 'hour': 18, 'minute': 17, 'sec': 3, 'hour_minute': '18:17'}, 'Keyword ID': 'sr3_4VzRD3sp', 'Creative ID': '5184986204', 'Keyword': 'Bathroom Cleaning Tips', 'Match Type': 'be', 'Device': 'c', 'Conversions': [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], 'Revenues': [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], 'account_id': 'baron'},
  {'date_buckets': {'date': '2015-04-29T00:17:03.107Z', 'day': 28, 'hour': 18, 'minute': 17, 'sec': 3, 'hour_minute': '18:17'}, 'Keyword ID': 'sr3_HZAarvKy', 'Creative ID': '6074827333', 'Keyword': 'Drain Clogs', 'Match Type': 'bp', 'Device': 'c', 'Conversions': [1, 0, 0, 1, 0, 0, 0, 0, 0], 'Revenues': [5, 0, 0, 5, 0, 0, 0, 0, 0], 'account_id': 'baron'},
  {'date_buckets': {'date': '2015-04-29T00:17:03.107Z', 'day': 28, 'hour': 18, 'minute': 17, 'sec': 3, 'hour_minute': '18:17'}, 'Keyword ID': 'sr3_irU8fFk0', 'Creative ID': '6074827289', 'Keyword': 'unclog bathtub drain', 'Match Type': 'bp', 'Device': 'c', 'Conversions': [1, 0, 0, 1, 0, 0, 0, 0, 0], 'Revenues': [5, 0, 0, 5, 0, 0, 0, 0, 0], 'account_id': 'baron'}
]

exports.tryExamples = function (examples, operator) {
  test('More examples for ' + operator, function (t) {
    examples.forEach(function (val) {
      var input = val[0]
      var output = val[1]
      
      if (val[2] === true) { // Error
        t.throws(function () {
          _.computeValue({}, input, operator)
        }, 'Error: ' + output)
      } else {
        var result = _.computeValue({}, input, operator)
        t.deepEqual(result, val[1], operator + ':\t' + _.stringify(input) + '\t=>\t' + _.stringify(output))
      }
    })
    t.end()
  })
}
