var test = require('tape'),
  Mingo = require('../mingo');

test("String Operators", function (t) {
  t.plan(5);
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
