import * as samples from "../../support";

samples.runTestPipeline("operators/pipeline/unset", [
  {
    message: "Using Two $addFields Stages",
    pipeline: [
      {
        $addFields: {
          totalHomework: { $sum: "$homework" },
          totalQuiz: { $sum: "$quiz" },
        },
      },
      {
        $addFields: {
          totalScore: {
            $add: ["$totalHomework", "$totalQuiz", "$extraCredit"],
          },
        },
      },
    ],
    input: [
      {
        _id: 1,
        student: "Maya",
        homework: [10, 5, 10],
        quiz: [10, 8],
        extraCredit: 0,
      },
      {
        _id: 2,
        student: "Ryan",
        homework: [5, 6, 5],
        quiz: [8, 8],
        extraCredit: 8,
      },
    ],
    expected: [
      {
        _id: 1,
        student: "Maya",
        homework: [10, 5, 10],
        quiz: [10, 8],
        extraCredit: 0,
        totalHomework: 25,
        totalQuiz: 18,
        totalScore: 43,
      },
      {
        _id: 2,
        student: "Ryan",
        homework: [5, 6, 5],
        quiz: [8, 8],
        extraCredit: 8,
        totalHomework: 16,
        totalQuiz: 16,
        totalScore: 40,
      },
    ],
  },
  {
    message: "Adding Fields to an Embedded Document",
    pipeline: [
      {
        $addFields: {
          "specs.fuel_type": "unleaded",
        },
      },
    ],
    input: [
      { _id: 1, type: "car", specs: { doors: 4, wheels: 4 } },
      { _id: 2, type: "motorcycle", specs: { doors: 0, wheels: 2 } },
      { _id: 3, type: "jet ski" },
    ],
    expected: [
      {
        _id: 1,
        type: "car",
        specs: { doors: 4, wheels: 4, fuel_type: "unleaded" },
      },
      {
        _id: 2,
        type: "motorcycle",
        specs: { doors: 0, wheels: 2, fuel_type: "unleaded" },
      },
      { _id: 3, type: "jet ski", specs: { fuel_type: "unleaded" } },
    ],
  },
  {
    message: "Overwriting an existing field",
    pipeline: [
      {
        $addFields: { cats: 20 },
      },
    ],
    input: [{ _id: 1, dogs: 10, cats: 15 }],
    expected: [{ _id: 1, dogs: 10, cats: 20 }],
  },
  {
    message: "Replace one field with another",
    pipeline: [
      {
        $addFields: {
          _id: "$item",
          item: "fruit",
        },
      },
    ],
    input: [
      { _id: 1, item: "tangerine", type: "citrus" },
      { _id: 2, item: "lemon", type: "citrus" },
      { _id: 3, item: "grapefruit", type: "citrus" },
    ],
    expected: [
      { _id: "tangerine", item: "fruit", type: "citrus" },
      { _id: "lemon", item: "fruit", type: "citrus" },
      { _id: "grapefruit", item: "fruit", type: "citrus" },
    ],
  },
  {
    message: "can $addField with boolean values",
    pipeline: [
      {
        $addFields: {
          accountInfo: {
            $arrayElemAt: ["$accounts", 0],
          },
        },
      },
    ],
    input: [
      {
        _id: "59c52580809dd0032d75238a",
        email: "an@email.com",
        deleted: false,
        accounts: [
          {
            createdAt: "2017-09-22T15:00:17.418Z",
            updatedAt: "2017-09-22T15:00:17.418Z",
          },
        ],
      },
    ],
    expected: [
      {
        _id: "59c52580809dd0032d75238a",
        email: "an@email.com",
        deleted: false,
        accountInfo: {
          createdAt: "2017-09-22T15:00:17.418Z",
          updatedAt: "2017-09-22T15:00:17.418Z",
        },
        accounts: [
          {
            createdAt: "2017-09-22T15:00:17.418Z",
            updatedAt: "2017-09-22T15:00:17.418Z",
          },
        ],
      },
    ],
  },
  {
    message: "can be aliased as $set",
    pipeline: [
      {
        $addFields: {
          accountInfo: {
            $arrayElemAt: ["$accounts", 0],
          },
        },
      },
    ],
    input: [
      {
        _id: "59c52580809dd0032d75238a",
        email: "an@email.com",
        deleted: false,
        accounts: [
          {
            createdAt: "2017-09-22T15:00:17.418Z",
            updatedAt: "2017-09-22T15:00:17.418Z",
          },
        ],
      },
    ],
    expected: [
      {
        _id: "59c52580809dd0032d75238a",
        email: "an@email.com",
        deleted: false,
        accountInfo: {
          createdAt: "2017-09-22T15:00:17.418Z",
          updatedAt: "2017-09-22T15:00:17.418Z",
        },
        accounts: [
          {
            createdAt: "2017-09-22T15:00:17.418Z",
            updatedAt: "2017-09-22T15:00:17.418Z",
          },
        ],
      },
    ],
  },
]);
