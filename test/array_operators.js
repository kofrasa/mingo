var test = require('tape'),
  Mingo = require('../mingo');

var _ = Mingo._internal();


test("Array Operators", function (t) {

  var result = Mingo.aggregate([
    {"_id": 1, "item": "ABC1", "description": "product 1", colors: ["blue", "black", "red"]},
    {"_id": 2, "item": "ABC2", "description": "product 2", colors: ["purple"]},
    {"_id": 3, "item": "XYZ1", "description": "product 3", colors: []}
  ], [{
    $project: {
      item: 1,
      numberOfColors: {$size: "$colors"}
    }
  }]);

  t.deepEqual([
    {"_id": 1, "item": "ABC1", "numberOfColors": 3},
    {"_id": 2, "item": "ABC2", "numberOfColors": 1},
    {"_id": 3, "item": "XYZ1", "numberOfColors": 0}
  ], result, "can apply $size operator");

  result = Mingo.aggregate([
    { "_id" : 1, "name" : "dave123", favorites: [ "chocolate", "cake", "butter", "apples" ] },
    { "_id" : 2, "name" : "li", favorites: [ "apples", "pudding", "pie" ] },
    { "_id" : 3, "name" : "ahn", favorites: [ "pears", "pecans", "chocolate", "cherries" ] },
    { "_id" : 4, "name" : "ty", favorites: [ "ice cream" ] }
    ], [
     {
       $project:
        {
           name: 1,
           first: { $arrayElemAt: [ "$favorites", 0 ] },
           last: { $arrayElemAt: [ "$favorites", -1 ] }
        }
     }
  ]);

  t.deepEqual(result, [
    { "_id" : 1, "name" : "dave123", "first" : "chocolate", "last" : "apples" },
    { "_id" : 2, "name" : "li", "first" : "apples", "last" : "pie" },
    { "_id" : 3, "name" : "ahn", "first" : "pears", "last" : "cherries" },
    { "_id" : 4, "name" : "ty", "first" : "ice cream", "last" : "ice cream" }
  ], "can apply $arrayElemAt operator");


  // $concatArrays
  result = Mingo.aggregate([
    { "_id" : 1, instock: [ "chocolate" ], ordered: [ "butter", "apples" ] },
    { "_id" : 2, instock: [ "apples", "pudding", "pie" ] },
    { "_id" : 3, instock: [ "pears", "pecans"], ordered: [ "cherries" ] },
    { "_id" : 4, instock: [ "ice cream" ], ordered: [ ] }
  ], [
   { $project: { items: { $concatArrays: [ "$instock", "$ordered" ] } } }
  ]);

  t.deepEqual(result, [
    { "_id" : 1, "items" : [ "chocolate", "butter", "apples" ] },
    { "_id" : 2, "items" : null },
    { "_id" : 3, "items" : [ "pears", "pecans", "cherries" ] },
    { "_id" : 4, "items" : [ "ice cream" ] }
  ], "can apply $concatArrays opertator");

  // $filter
  var data = [
    {
       _id: 0,
       items: [
         { item_id: 43, quantity: 2, price: 10 },
         { item_id: 2, quantity: 1, price: 240 }
       ]
    },
    {
       _id: 1,
       items: [
         { item_id: 23, quantity: 3, price: 110 },
         { item_id: 103, quantity: 4, price: 5 },
         { item_id: 38, quantity: 1, price: 300 }
       ]
    },
    {
        _id: 2,
        items: [
           { item_id: 4, quantity: 1, price: 23 }
        ]
    }
  ];

  result = Mingo.aggregate(data, [
    {
        $project: {
           items: {
              $filter: {
                 input: "$items",
                 as: "item",
                 cond: { $gte: [ "$$item.price", 100 ] }
              }
           }
        }
     }
  ]);

  t.deepEqual(result, [
    {
       "_id" : 0,
       "items" : [
          { "item_id" : 2, "quantity" : 1, "price" : 240 }
       ]
    },
    {
       "_id" : 1,
       "items" : [
          { "item_id" : 23, "quantity" : 3, "price" : 110 },
          { "item_id" : 38, "quantity" : 1, "price" : 300 }
       ]
    },
    { "_id" : 2, "items" : [ ] }
  ], "can apply $filter array operator");

  // $indexOfArray
  data = [
    { "_id" : 1, "items" : ["one", "two", "three"] },
    { "_id" : 2, "items" : [1, 2, 3] },
    { "_id" : 3, "items" : [null, null, 2] },
    { "_id" : 4, "items" : null },
    { "_id" : 5, "amount" : 3 }
  ];

  result = Mingo.aggregate(data,
   [
     {
       $project:
          {
            index: { $indexOfArray: [ "$items", 2 ] },
          }
      }
  ]);

  t.deepEqual(result, [
    { "_id" : 1, "index" : -1 },
    { "_id" : 2, "index" : 1 },
    { "_id" : 3, "index" : 2 },
    { "_id" : 4, "index" : null },
    { "_id" : 5, "index" : null }
  ], "can apply $indexOfArray array operator");


  // $isArray
  var warehouses = [
    { "_id" : 1, instock: [ "chocolate" ], ordered: [ "butter", "apples" ] },
    { "_id" : 2, instock: [ "apples", "pudding", "pie" ] },
    { "_id" : 3, instock: [ "pears", "pecans"], ordered: [ "cherries" ] },
    { "_id" : 4, instock: [ "ice cream" ], ordered: [ ] }
  ];

  result = Mingo.aggregate(warehouses, [
     { $project:
        { items:
            { $cond:
              {
                if: { $and: [ { $isArray: "$instock" }, { $isArray: "$ordered" } ] },
                then: { $concatArrays: [ "$instock", "$ordered" ] },
                else: "One or more fields is not an array."
              }
            }
        }
     }
  ]);

  t.deepEqual(result, [
    { "_id" : 1, "items" : [ "chocolate", "butter", "apples" ] },
    { "_id" : 2, "items" : "One or more fields is not an array." },
    { "_id" : 3, "items" : [ "pears", "pecans", "cherries" ] },
    { "_id" : 4, "items" : [ "ice cream" ] }
  ], "can apply $isArray operator");

  // $range
  var distances = [
    { _id: 0, city: "San Jose", distance: 42 },
    { _id: 1, city: "Sacramento", distance: 88 },
    { _id: 2, city: "Reno", distance: 218 },
    { _id: 3, city: "Los Angeles", distance: 383 }
  ];

  result = Mingo.aggregate(distances, [
    {
      $project: {
        _id: 0,
        city: 1,
        "Rest stops": { $range: [ 0, "$distance", 25 ] }
      }
    }
  ]);

  t.deepEqual(result, [
    { "city" : "San Jose", "Rest stops" : [ 0, 25 ] },
    { "city" : "Sacramento", "Rest stops" : [ 0, 25, 50, 75 ] },
    { "city" : "Reno", "Rest stops" : [ 0, 25, 50, 75, 100, 125, 150, 175, 200 ] },
    { "city" : "Los Angeles", "Rest stops" : [ 0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375 ] }
  ], "can apply $range operator");

  data = [
    [[ 0, 10, 2 ], [ 0, 2, 4, 6, 8 ]],
    [[ 10, 0, -2 ], [ 10, 8, 6, 4, 2 ]],
    [[ 0, 10, -2 ], [ ]],
    [[ 0, 5 ], [ 0, 1, 2, 3, 4]]
  ];

  data.forEach(function (val) {
    result = _.computeValue({}, val[0], "$range");
    t.deepEqual(result, val[1], "$range test> in: [" +val[0] + "] out: [" + val[1] + "]");
  })


  t.end();
});
