var test = require('tape')
var Mingo = require('../mingo')

test('Group Accumulator Operators', function (t) {
  var data = [
    { '_id': 1, 'name': 'dave123', 'quiz': 1, 'score': 85 },
    { '_id': 2, 'name': 'dave2', 'quiz': 1, 'score': 90 },
    { '_id': 3, 'name': 'ahn', 'quiz': 1, 'score': 71 },
    { '_id': 4, 'name': 'li', 'quiz': 2, 'score': 96 },
    { '_id': 5, 'name': 'annT', 'quiz': 2, 'score': 77 },
    { '_id': 6, 'name': 'ty', 'quiz': 2, 'score': 82 }
  ]

  var result = Mingo.aggregate(data, [
     { $group: { _id: '$quiz', stdDev: { $stdDevPop: '$score' } } }
  ])

  t.deepEqual(result, [
    { '_id': 1, 'stdDev': 8.04155872120988 },
    { '_id': 2, 'stdDev': 8.04155872120988 }
  ], 'can use $stdDevPop with $group')

  data = [
    {
      '_id': 1,
      'scores': [
        {
          'name': 'dave123',
          'score': 85
        },
        {
          'name': 'dave2',
          'score': 90
        },
        {
          'name': 'ahn',
          'score': 71
        }
      ]
    },
    {
      '_id': 2,
      'scores': [
        {
          'name': 'li',
          'quiz': 2,
          'score': 96
        },
        {
          'name': 'annT',
          'score': 77
        },
        {
          'name': 'ty',
          'score': 82
        }
      ]
    }
  ]

  result = Mingo.aggregate(data, [
     { $project: { stdDev: { $stdDevPop: '$scores.score' } } }
  ])

  t.deepEqual(result, [
    { '_id': 1, 'stdDev': 8.04155872120988 },
    { '_id': 2, 'stdDev': 8.04155872120988 }
  ], 'can use $stdDevPop with $project')

  t.end()
})
