var test = require('tape')
var mingo = require('../es5')
var samples = require('./support')


test('10gen Education: M101P', function (t) {
  var cursor = mingo.find(samples.simpleGradesData, {
    type: 'exam',
    score: { $gte: 65 }
  })

  var student = cursor.sort({ 'score': 1 }).limit(1).next()
  t.equal(student.student_id, 22, 'Student ID with lowest exam score is 22')

  var homework = mingo.find(samples.simpleGradesData, { type: 'homework' }).sort({ 'student_id': 1, 'score': 1 }).all()
  var ids = []
  var sid = null
  for (var i = 0, j = 0; i < homework.length; i++) {
    if (homework[i]['student_id'] !== sid) {
      ids.push(homework[i]['_id'])
      sid = homework[i]['student_id']
    }
  }

  t.equal(ids.length, 200, '200 minimum homework scores found')
  var result = mingo.remove(samples.simpleGradesData, { '_id': { $in: ids } })

  // var res = Mingo.find(result).sort({'score':-1}).skip(100).limit(1).next();
  // console.log(res);
  // Mingo.find(result, {}, {'student_id':1, 'type':1, 'score':1, '_id':0}).sort({'student_id':1, 'score':1}).limit(5);

  t.equal(result.length, 600, 'remove lowest homework from grades for each student. count is 600')

  var res = mingo.aggregate(result, [
    { '$group': { '_id': '$student_id', 'average': { $avg: '$score' } } },
    { '$sort': { 'average': -1 } },
    { '$limit': 1 }
  ])
  t.equal(res[0]['_id'], 54, 'student with highest average has id 54')
  t.end()
})
