var test = require('tape'),
  Mingo = require('../mingo'),
  _ = Mingo._internal(),
  tryExamples = require('./samples').tryExamples;

test("String Operators", function (t) {

  var inventory = [
    {"_id": 1, "item": "ABC1", quarter: "13Q1", "description": "product 1"},
    {"_id": 2, "item": "ABC2", quarter: "13Q4", "description": "product 2"},
    {"_id": 3, "item": "XYZ1", quarter: "14Q2", "description": null}
  ];

  // $concat
  var result = Mingo.aggregate(inventory, [
    {$project: {itemDescription: {$concat: ["$item", " - ", "$description"]}}}
  ]);

  t.deepEqual(result, [
    {"_id": 1, "itemDescription": "ABC1 - product 1"},
    {"_id": 2, "itemDescription": "ABC2 - product 2"},
    {"_id": 3, "itemDescription": null}
  ], "aggregate with $concat");

  // $indexOfBytes
  var examples = [
    [ [ "cafeteria", "e" ],	3 ],
    [ [ "cafétéria", "é" ], 3 ],
    [ [ "cafétéria", "e" ], -1 ],
    [ [ "cafétéria", "t" ], 4 ], // "5" is an error in MongoDB docs.
    [ [ "foo.bar.fi", ".", 5 ], 7 ],
    [ [ "vanilla", "ll", 0, 2 ], -1 ],
    // [ [ "vanilla", "ll", -1 ], -1 ], // should throw exception according to MongoDB docs
    [ [ "vanilla", "ll", 12 ], -1 ],
    [ [ "vanilla", "ll", 5, 2 ], -1 ],
    [ [ "vanilla", "nilla", 3 ], -1 ],
    [ [ null, "foo" ], null ]
  ];

  tryExamples(examples, "$indexOfBytes");

  t.throws(function () {
    _.computeValue({}, [ "vanilla", "ll", -1 ], "$indexOfBytes");
  }, /\$indexOfBytes third operand must resolve to a non-negative integer/);

  // $substr
  result = Mingo.aggregate(inventory, [
    {
      $project: {
        item: 1,
        yearSubstring: {$substr: ["$quarter", 0, 2]},
        quarterSubtring: {$substr: ["$quarter", 2, -1]}
      }
    }
  ]);

  t.deepEqual(result, [
    {"_id": 1, "item": "ABC1", "yearSubstring": "13", "quarterSubtring": "Q1"},
    {"_id": 2, "item": "ABC2", "yearSubstring": "13", "quarterSubtring": "Q4"},
    {"_id": 3, "item": "XYZ1", "yearSubstring": "14", "quarterSubtring": "Q2"}
  ], "aggregate with $substr");

  // for casing functions
  var inventoryMixedCase = [
    {"_id": 1, "item": "ABC1", quarter: "13Q1", "description": "PRODUCT 1"},
    {"_id": 2, "item": "abc2", quarter: "13Q4", "description": "Product 2"},
    {"_id": 3, "item": "xyz1", quarter: "14Q2", "description": null}
  ];

  // $toLower
  result = Mingo.aggregate(inventoryMixedCase, [
    {
      $project: {
        item: {$toLower: "$item"},
        description: {$toLower: "$description"}
      }
    }
  ]);

  t.deepEqual(result, [
    {"_id": 1, "item": "abc1", "description": "product 1"},
    {"_id": 2, "item": "abc2", "description": "product 2"},
    {"_id": 3, "item": "xyz1", "description": ""}
  ], "aggregate with $toLower");

  // $toUpper
  result = Mingo.aggregate(inventoryMixedCase, [
    {
      $project: {
        item: {$toUpper: "$item"},
        description: {$toUpper: "$description"}
      }
    }
  ]);

  t.deepEqual(result, [
    {"_id": 1, "item": "ABC1", "description": "PRODUCT 1"},
    {"_id": 2, "item": "ABC2", "description": "PRODUCT 2"},
    {"_id": 3, "item": "XYZ1", "description": ""}
  ], "aggregate with $toUpper");

  // $strcasecmp
  result = Mingo.aggregate(inventory, [
    {
      $project: {
        item: 1,
        comparisonResult: {$strcasecmp: ["$quarter", "13q4"]}
      }
    }
  ]);
  t.deepEqual(result, [
    {"_id": 1, "item": "ABC1", "comparisonResult": -1},
    {"_id": 2, "item": "ABC2", "comparisonResult": 0},
    {"_id": 3, "item": "XYZ1", "comparisonResult": 1}
  ], "aggregate with $strcasecmp");

  t.end();
});
