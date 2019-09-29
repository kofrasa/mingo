var test = require('tape')
var mingo = require('../../dist/mingo')

/**
 * Tests for $addFields operator
 */
test("$addFields pipeline operator", function (t) {
  var scores = [
    {
      _id: 1,
      student: "Maya",
      homework: [10, 5, 10],
      quiz: [10, 8],
      extraCredit: 0
    },
    {
      _id: 2,
      student: "Ryan",
      homework: [5, 6, 5],
      quiz: [8, 8],
      extraCredit: 8
    }
  ];

  var result = mingo.aggregate(scores, [
    {
      $addFields: {
        totalHomework: { $sum: "$homework" },
        totalQuiz: { $sum: "$quiz" }
      }
    },
    {
      $addFields: {
        totalScore: { $add: ["$totalHomework", "$totalQuiz", "$extraCredit"] }
      }
    }
  ]);

  t.deepEqual(result, [
    {
      "_id": 1,
      "student": "Maya",
      "homework": [10, 5, 10],
      "quiz": [10, 8],
      "extraCredit": 0,
      "totalHomework": 25,
      "totalQuiz": 18,
      "totalScore": 43
    },
    {
      "_id": 2,
      "student": "Ryan",
      "homework": [5, 6, 5],
      "quiz": [8, 8],
      "extraCredit": 8,
      "totalHomework": 16,
      "totalQuiz": 16,
      "totalScore": 40
    }
  ], "Using Two $addFields Stages");

  var vehicles = [
    { _id: 1, type: "car", specs: { doors: 4, wheels: 4 } },
    { _id: 2, type: "motorcycle", specs: { doors: 0, wheels: 2 } },
    { _id: 3, type: "jet ski" }
  ];

  result = mingo.aggregate(vehicles, [
    {
      $addFields: {
        "specs.fuel_type": "unleaded"
      }
    }
  ]);

  t.deepEqual(result, [
    { _id: 1, type: "car", specs: { doors: 4, wheels: 4, fuel_type: "unleaded" } },
    { _id: 2, type: "motorcycle", specs: { doors: 0, wheels: 2, fuel_type: "unleaded" } },
    { _id: 3, type: "jet ski", specs: { fuel_type: "unleaded" } }
  ], "Adding Fields to an Embedded Document");


  var animals = [{ _id: 1, dogs: 10, cats: 15 }];

  result = mingo.aggregate(animals, [
    {
      $addFields: { "cats": 20 }
    }
  ]);

  t.deepEqual(result, [{ _id: 1, dogs: 10, cats: 20 }], "Overwriting an existing field");

  var fruit = [
    { "_id": 1, "item": "tangerine", "type": "citrus" },
    { "_id": 2, "item": "lemon", "type": "citrus" },
    { "_id": 3, "item": "grapefruit", "type": "citrus" }
  ];

  result = mingo.aggregate(fruit, [
    {
      $addFields: {
        _id: "$item",
        item: "fruit"
      }
    }
  ]);

  t.deepEqual(result, [
    { "_id": "tangerine", "item": "fruit", "type": "citrus" },
    { "_id": "lemon", "item": "fruit", "type": "citrus" },
    { "_id": "grapefruit", "item": "fruit", "type": "citrus" }
  ], "Replace one field with another");

  const col = [{
    _id: '59c52580809dd0032d75238a',
    email: 'an@email.com',
    deleted: false,
    accounts: [{
      createdAt: '2017-09-22T15:00:17.418Z',
      updatedAt: '2017-09-22T15:00:17.418Z',
    }],
  }]

  const expected = [{
    _id: '59c52580809dd0032d75238a',
    email: 'an@email.com',
    deleted: false,
    accountInfo: {
      createdAt: '2017-09-22T15:00:17.418Z',
      updatedAt: '2017-09-22T15:00:17.418Z',
    },
    accounts: [{
      createdAt: '2017-09-22T15:00:17.418Z',
      updatedAt: '2017-09-22T15:00:17.418Z',
    }],
  }]

  var actual = mingo.aggregate(col, [{
    $addFields: {
      accountInfo: {
        $arrayElemAt: ['$accounts', 0],
      },
    },
  }])

  t.deepEqual(actual, expected, 'can $addField with boolean values')

  actual = mingo.aggregate(col, [{
    $set: {
      accountInfo: {
        $arrayElemAt: ['$accounts', 0],
      },
    },
  }])

  t.deepEqual(actual, expected, 'can be aliased as $set')

  t.end();
});
