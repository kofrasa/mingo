var test = require('tape')
var mingo = require('../dist/mingo')
var samples = require('./samples')
var _ = mingo._internal()


test("Aggregation Pipeline Operators", function (t) {
  var sales = [
    { "_id": 1, "item": "abc", "price": 10, "quantity": 2, "date": new Date("2014-01-01T08:00:00Z") },
    { "_id": 2, "item": "jkl", "price": 20, "quantity": 1, "date": new Date("2014-02-03T09:00:00Z") },
    { "_id": 3, "item": "xyz", "price": "5", "quantity": 5, "date": new Date("2014-02-03T09:05:00Z") },
    { "_id": 10, "item": "xyz", "quantity": 5, "date": new Date("2014-02-03T09:05:00Z") },
    { "_id": 4, "item": "abc", "price": 10, "quantity": 10, "date": new Date("2014-02-15T08:00:00Z") },
    { "_id": 5, "item": "xyz", "price": 5, "quantity": 10, "date": new Date("2014-02-15T09:05:00Z") }
  ];

  t.test("$match operator", function (t) {
    t.plan(1);
    var result = mingo.aggregate(samples.students, [
      { '$match': { _id: { $in: [0, 1, 2, 3, 4] } } }
    ]);
    t.ok(result.length === 5, "can filter collection with $match");
  });

  t.test("$unwind operator", function (t) {
    t.plan(1)
    var flattened = mingo.aggregate(samples.students, [
      { '$unwind': '$scores' }
    ]);
    t.ok(flattened.length === 800, "can unwind array value in collection");
  });

  t.test("$project operator", function (t) {
    t.plan(13);
    var result = mingo.aggregate(
      samples.students,
      [
        { '$unwind': '$scores' },
        {
          '$project': {
            'name': 1,
            'type': '$scores.type',
            'details': {
              "plus10": { $add: ["$scores.score", 10] }
            }
          }
        },
        { '$limit': 1 }
      ]
    );

    var fields = Object.keys(result[0]);
    t.equal(fields.length, 4, "can project fields with $project");
    t.ok(fields.includes('type'), "can rename fields with $project");
    var temp = result[0]['details'];
    t.ok(_.isObject(temp) && Object.keys(temp).length === 1, "can create and populate sub-documents");

    // examples from mongoDB website

    var products = [
      { "_id": 1, "item": "abc1", description: "product 1", qty: 300 },
      { "_id": 2, "item": "abc2", description: "product 2", qty: 200 },
      { "_id": 3, "item": "xyz1", description: "product 3", qty: 250 },
      { "_id": 4, "item": "VWZ1", description: "product 4", qty: 300 },
      { "_id": 5, "item": "VWZ2", description: "product 5", qty: 180 }
    ];

    result = mingo.aggregate(products, [
      {
        $project: {
          item: 1,
          qty: 1,
          qtyEq250: { $eq: ["$qty", 250] },
          _id: 0
        }
      }
    ]);
    t.deepEqual(result, [
      { "item": "abc1", "qty": 300, "qtyEq250": false },
      { "item": "abc2", "qty": 200, "qtyEq250": false },
      { "item": "xyz1", "qty": 250, "qtyEq250": true },
      { "item": "VWZ1", "qty": 300, "qtyEq250": false },
      { "item": "VWZ2", "qty": 180, "qtyEq250": false }
    ], "can project with $eq operator");

    // $cmp
    result = mingo.aggregate(products, [
      {
        $project: {
          item: 1,
          qty: 1,
          cmpTo250: { $cmp: ["$qty", 250] },
          _id: 0
        }
      }]);
    t.deepEqual(result, [
      { "item": "abc1", "qty": 300, "cmpTo250": 1 },
      { "item": "abc2", "qty": 200, "cmpTo250": -1 },
      { "item": "xyz1", "qty": 250, "cmpTo250": 0 },
      { "item": "VWZ1", "qty": 300, "cmpTo250": 1 },
      { "item": "VWZ2", "qty": 180, "cmpTo250": -1 }
    ], "can project with $cmp operator");

    result = mingo.aggregate(
      samples.students,
      [
        {
          '$project': {
            'name': 0
          }
        },
        { '$limit': 1 }
      ]
    );

    fields = Object.keys(result[0]);
    t.ok(fields.length === 2, "2/3 fields are included. Instead: " + fields.length);
    t.ok(fields.indexOf('name') === -1, "name is excluded");
    t.ok(fields.indexOf('_id') >= 0, "_id is included");
    t.ok(fields.indexOf('scores') >= 0, "score is included");

    result = mingo.aggregate(
      samples.students,
      [
        {
          '$project': {
            '_id': 0
          }
        },
        { '$limit': 1 }
      ]
    );

    fields = Object.keys(result[0]);
    t.ok(fields.length === 2, "2/3 fields are included. Instead: " + fields.length);
    t.ok(fields.indexOf('name') >= 0, "name is included");
    t.ok(fields.indexOf('_id') === -1, "_id is excluded");
    t.ok(fields.indexOf('scores') >= 0, "score is included");
  });

  t.test("$group operator", function (t) {

    var flattened = mingo.aggregate(samples.students, [
      { '$unwind': '$scores' }
    ]);
    var grouped = mingo.aggregate(flattened, [{
      '$group': {
        '_id': '$scores.type', 'highest': { $max: '$scores.score' },
        'lowest': { $min: '$scores.score' }, 'average': { $avg: '$scores.score' }, 'count': { $sum: 1 }
      }
    }
    ]);
    t.ok(grouped.length === 3, "can group collection with $group");
    grouped = mingo.aggregate(sales, [
      { $group: { max: { $max: "$price" }, sum: { $sum: "$price" } } }
    ]);

    t.ok(grouped.length === 1 && grouped[0]['max'] === 20, "can compute $max");
    t.ok(grouped.length === 1 && grouped[0]['sum'] === 45, "can compute $sum");

    grouped = mingo.aggregate(samples.groupByObjectsData, [
        { "$match": {} }, {
          "$group": {
            "_id": {
              "hour": "$date_buckets.hour",
              "keyword": "$Keyword"
            }, "total": { "$sum": 1 }
          }
        }, { "$sort": { "total": -1 } }, { "$limit": 5 }, {
          "$project": {
            "_id": 0,
            //"hour": "$_id.hour",
            "keyword": "$_id.keyword",
            "total": 1
          }
        }]
    );

    t.deepEqual(grouped, [
      { "total": 2, "keyword": "Bathroom Cleaning Tips" },
      { "total": 1, "keyword": "Cleaning Bathroom Tips" },
      { "total": 1, "keyword": "best way to clean a bathroom" },
      { "total": 1, "keyword": "Drain Clogs" },
      { "total": 1, "keyword": "unclog bathtub drain" }
    ], "can group by object key");

    var books = [
      { "_id": 8751, "title": "The Banquet", "author": "Dante", "copies": 2 },
      { "_id": 8752, "title": "Divine Comedy", "author": "Dante", "copies": 1 },
      { "_id": 8645, "title": "Eclogues", "author": "Dante", "copies": 2 },
      { "_id": 7000, "title": "The Odyssey", "author": "Homer", "copies": 10 },
      { "_id": 7020, "title": "Iliad", "author": "Homer", "copies": 10 }
    ];

    result = mingo.aggregate(books, [
        { $group: { _id: "$author", books: { $push: "$title" } } },
        { $sort: { _id: -1 } }
      ]
    );

    t.deepEqual(result, [
      { "_id": "Homer", "books": ["The Odyssey", "Iliad"] },
      { "_id": "Dante", "books": ["The Banquet", "Divine Comedy", "Eclogues"] }
    ], "Group title by author");

    result = mingo.aggregate(books, [
        { $group: { _id: "$author", books: { $push: "$$ROOT" } } },
        { $sort: { _id: -1 } }
      ]
    );

    t.deepEqual(result, [
      {
        "_id": "Homer",
        "books": [
          { "_id": 7000, "title": "The Odyssey", "author": "Homer", "copies": 10 },
          { "_id": 7020, "title": "Iliad", "author": "Homer", "copies": 10 }
        ]
      },
      {
        "_id": "Dante",
        "books": [
          { "_id": 8751, "title": "The Banquet", "author": "Dante", "copies": 2 },
          { "_id": 8752, "title": "Divine Comedy", "author": "Dante", "copies": 1 },
          { "_id": 8645, "title": "Eclogues", "author": "Dante", "copies": 2 }
        ]
      }
    ], "Group Documents by author");

    expected = [
      { "_id": "Homer", "books": ["The Odyssey", "Iliad"] },
      { "_id": "Dante", "books": ["The Banquet", "Divine Comedy", "Eclogues"] }
    ];

    result = mingo.aggregate(books, [
        { $group: { _id: "$author", books: { $push: "$$ROOT.title" } } },
        { $sort: { _id: -1 } }
      ]
    );

    t.deepEqual(result, expected, "Group title by author - $$ROOT.field");

    result = mingo.aggregate(books, [
        { $group: { _id: "$author", books: { $push: "$$CURRENT.title" } } },
        { $sort: { _id: -1 } }
      ]
    );

    t.deepEqual(result, expected, "Group title by author - $$CURRENT.title");

    t.end();

  });

  t.test("$limit operator", function (t) {
    t.plan(1);
    var result = mingo.aggregate(samples.students, [
      { '$limit': 100 }
    ]);
    t.ok(result.length === 100, "can limit result with $limit");
  });

  t.test("$skip operator", function (t) {
    t.plan(1);
    var result = mingo.aggregate(samples.students, [
      { '$skip': 100 }
    ]);
    t.ok(result.length === samples.students.length - 100, "can skip result with $skip");
  });

  t.test("$sort operator", function (t) {
    t.plan(2);
    var result = mingo.aggregate(samples.students, [
      { '$sort': { '_id': -1 } }
    ]);
    t.ok(result[0]['_id'] === 199, "can sort collection with $sort");

    var data = [
      { _id: 'c', date: new Date(2018, 1, 1) },
      { _id: 'a', date: new Date(2017, 1, 1) },
      { _id: 'b', date: new Date(2017, 1, 1) }
    ];
    var expected = [
      { _id: 'a', date: new Date(2017, 1, 1) },
      { _id: 'b', date: new Date(2017, 1, 1) },
      { _id: 'c', date: new Date(2018, 1, 1) },
    ]

    result = mingo.aggregate(data, [{ "$sort": { "date": 1 } }]);
    t.deepEqual(result, expected, "can sort on complex fields");
  });

  /**
   * Test for $redact operator
   * https://docs.mongodb.com/manual/reference/operator/aggregation/redact/
   */
  t.test("$redact operator", function (t) {
    var data = [{
      _id: 1,
      title: "123 Department Report",
      tags: ["G", "STLW"],
      year: 2014,
      subsections: [
        {
          subtitle: "Section 1: Overview",
          tags: ["SI", "G"],
          content: "Section 1: This is the content of section 1."
        },
        {
          subtitle: "Section 2: Analysis",
          tags: ["STLW"],
          content: "Section 2: This is the content of section 2."
        },
        {
          subtitle: "Section 3: Budgeting",
          tags: ["TK"],
          content: {
            text: "Section 3: This is the content of section3.",
            tags: ["HCS"]
          }
        }
      ]
    }];

    var userAccess = ["STLW", "G"];
    var query = [
      { $match: { year: 2014 } },
      {
        $redact: {
          $cond: {
            if: { $gt: [{ $size: { $setIntersection: ["$tags", userAccess] } }, 0] },
            then: "$$DESCEND",
            else: "$$PRUNE"
          }
        }
      }
    ];

    var result = mingo.aggregate(data, query);

    t.deepEqual(result, [
      {
        "_id": 1,
        "title": "123 Department Report",
        "tags": ["G", "STLW"],
        "year": 2014,
        "subsections": [
          {
            "subtitle": "Section 1: Overview",
            "tags": ["SI", "G"],
            "content": "Section 1: This is the content of section 1."
          },
          {
            "subtitle": "Section 2: Analysis",
            "tags": ["STLW"],
            "content": "Section 2: This is the content of section 2."
          }
        ]
      }
    ], "Evaluate Access at Every Document Level");

    data = [{
      _id: 1,
      level: 1,
      acct_id: "xyz123",
      cc: {
        level: 5,
        type: "yy",
        num: 0,
        exp_date: new Date("2015-11-01T00:00:00.000Z"),
        billing_addr: {
          level: 5,
          addr1: "123 ABC Street",
          city: "Some City"
        },
        shipping_addr: [
          {
            level: 3,
            addr1: "987 XYZ Ave",
            city: "Some City"
          },
          {
            level: 3,
            addr1: "PO Box 0123",
            city: "Some City"
          }
        ]
      },
      status: "A"
    }];

    query = [
      { $match: { status: "A" } },
      {
        $redact: {
          $cond: {
            if: { $eq: ["$level", 5] },
            then: "$$PRUNE",
            else: "$$DESCEND"
          }
        }
      }
    ];

    result = mingo.aggregate(data, query);

    t.deepEqual(result, [
      {
        "_id": 1,
        "level": 1,
        "acct_id": "xyz123",
        "status": "A"
      }
    ], "Exclude All Fields at a Given Level")

    t.end();
  });

  /**
   * Tests for $count pipeline operator
   */
  t.test("$count operator", function (t) {

    var scores = [
      { "_id": 1, "subject": "History", "score": 88 },
      { "_id": 2, "subject": "History", "score": 92 },
      { "_id": 3, "subject": "History", "score": 97 },
      { "_id": 4, "subject": "History", "score": 71 },
      { "_id": 5, "subject": "History", "score": 79 },
      { "_id": 6, "subject": "History", "score": 83 }
    ];

    var result = mingo.aggregate(scores,
      [
        {
          $match: {
            score: {
              $gt: 80
            }
          }
        },
        {
          $count: "passing_scores"
        }
      ]
    );

    t.deepEqual(result, { "passing_scores": 4 }, "can $count pipeline results");

    t.end();
  });

  /**
   * Tests for $sample operator
   */
  t.test("$sample operator", function (t) {
    var users = [
      { "_id": 1, "name": "dave123", "q1": true, "q2": true },
      { "_id": 2, "name": "dave2", "q1": false, "q2": false },
      { "_id": 3, "name": "ahn", "q1": true, "q2": true },
      { "_id": 4, "name": "li", "q1": true, "q2": false },
      { "_id": 5, "name": "annT", "q1": false, "q2": true },
      { "_id": 6, "name": "li", "q1": true, "q2": true },
      { "_id": 7, "name": "ty", "q1": false, "q2": true }
    ];

    var result = mingo.aggregate(users,
      [{ $sample: { size: 3 } }]
    );

    t.equals(result.length, 3, "can $sample pipeline input");
    t.end();
  });

  /**
   * Tests for $addFields operator
   */
  t.test("$addFields operator", function (t) {
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

    t.end();
  });

  /**
   * Tests for $sortByCount operator
   */
  t.test("$sortByCount operator", function (t) {
    var exhibits = [
      {
        "_id": 1,
        "title": "The Pillars of Society",
        "artist": "Grosz",
        "year": 1926,
        "tags": ["painting", "satire", "Expressionism", "caricature"]
      },
      { "_id": 2, "title": "Melancholy III", "artist": "Munch", "year": 1902, "tags": ["woodcut", "Expressionism"] },
      { "_id": 3, "title": "Dancer", "artist": "Miro", "year": 1925, "tags": ["oil", "Surrealism", "painting"] },
      { "_id": 4, "title": "The Great Wave off Kanagawa", "artist": "Hokusai", "tags": ["woodblock", "ukiyo-e"] },
      {
        "_id": 5,
        "title": "The Persistence of Memory",
        "artist": "Dali",
        "year": 1931,
        "tags": ["Surrealism", "painting", "oil"]
      },
      {
        "_id": 6,
        "title": "Composition VII",
        "artist": "Kandinsky",
        "year": 1913,
        "tags": ["oil", "painting", "abstract"]
      },
      {
        "_id": 7,
        "title": "The Scream",
        "artist": "Munch",
        "year": 1893,
        "tags": ["Expressionism", "painting", "oil"]
      },
      { "_id": 8, "title": "Blue Flower", "artist": "O'Keefe", "year": 1918, "tags": ["abstract", "painting"] }
    ];

    var result = mingo.aggregate(exhibits, [{ $unwind: "$tags" }, { $sortByCount: "$tags" }]);

    t.equals(result.every(function (o) {
      return Object.keys(o).length === 2
    }), true, "validate result return only 2 keys");

    t.equals(result[0]["count"], 6, "validate sorted max first");
    t.equals(result[7]["count"], 1, "validate sorted min last");

    // cannot enable below due to sort order variation
    // t.deepEqual(Object.keys(result[0])["count"], 6[
    //   { "_id" : "painting", "count" : 6 },
    //   { "_id" : "oil", "count" : 4 },
    //   { "_id" : "Expressionism", "count" : 3 },
    //   { "_id" : "Surrealism", "count" : 2 },
    //   { "_id" : "abstract", "count" : 2 },
    //   { "_id" : "woodblock", "count" : 1 },
    //   { "_id" : "woodcut", "count" : 1 },
    //   { "_id" : "ukiyo-e", "count" : 1 },
    //   { "_id" : "satire", "count" : 1 },
    //   { "_id" : "caricature", "count" : 1 }
    // ], "can apply $sortByCount pipeline operator");

    t.end();
  });

  /**
   * Tests for $replaceRoot operator
   */
  t.test("$replaceRoot operator", function (t) {
    var produce = [
      {
        "_id": 1,
        "fruit": ["apples", "oranges"],
        "in_stock": { "oranges": 20, "apples": 60 },
        "on_order": { "oranges": 35, "apples": 75 }
      },
      {
        "_id": 2,
        "vegetables": ["beets", "yams"],
        "in_stock": { "beets": 130, "yams": 200 },
        "on_order": { "beets": 90, "yams": 145 }
      }
    ];

    var result = mingo.aggregate(produce, [
      {
        $replaceRoot: { newRoot: "$in_stock" }
      }
    ]);

    t.deepEqual(result, [
      { "oranges": 20, "apples": 60 },
      { "beets": 130, "yams": 200 }
    ], "$replaceRoot with an embedded document");

    var people = [
      { "_id": 1, "name": "Arlene", "age": 34, "pets": { "dogs": 2, "cats": 1 } },
      { "_id": 2, "name": "Sam", "age": 41, "pets": { "cats": 1, "hamsters": 3 } },
      { "_id": 3, "name": "Maria", "age": 25 }
    ];

    result = mingo.aggregate(people, [
      {
        $match: { pets: { $exists: true } }
      },
      {
        $replaceRoot: { newRoot: "$pets" }
      }
    ]);

    t.deepEqual(result, [
      { "dogs": 2, "cats": 1 },
      { "cats": 1, "hamsters": 3 }
    ], "$replaceRoot with a $match stage");

    var contacts = [
      { "_id": 1, "first_name": "Gary", "last_name": "Sheffield", "city": "New York" },
      { "_id": 2, "first_name": "Nancy", "last_name": "Walker", "city": "Anaheim" },
      { "_id": 3, "first_name": "Peter", "last_name": "Sumner", "city": "Toledo" }
    ];

    result = mingo.aggregate(contacts, [
      {
        $replaceRoot: {
          newRoot: {
            full_name: {
              $concat: ["$first_name", " ", "$last_name"]
            }
          }
        }
      }
    ]);

    t.deepEqual(result, [
      { "full_name": "Gary Sheffield" },
      { "full_name": "Nancy Walker" },
      { "full_name": "Peter Sumner" }
    ], "$replaceRoot with a newly created document");

    contacts = [
      { "_id": 1, "name": "Susan", "phones": [{ "cell": "555-653-6527" }, { "home": "555-965-2454" }] },
      { "_id": 2, "name": "Mark", "phones": [{ "cell": "555-445-8767" }, { "home": "555-322-2774" }] }
    ];

    result = mingo.aggregate(contacts, [
      {
        $unwind: "$phones"
      },
      {
        $match: { "phones.cell": { $exists: true } }
      },
      {
        $replaceRoot: { newRoot: "$phones" }
      }
    ]);

    t.deepEqual(result, [
      { "cell": "555-653-6527" },
      { "cell": "555-445-8767" }
    ], "$replaceRoot with an array element");

    t.end();
  });

  /**
   * Tests for $lookup operator
   */
  t.test('$lookup operator', function (t) {
    var orders = [
      { "_id": 1, "item": "abc", "price": 12, "quantity": 2 },
      { "_id": 2, "item": "jkl", "price": 20, "quantity": 1 },
      { "_id": 3 }
    ]

    var inventory = [
      { "_id": 1, "sku": "abc", description: "product 1", "instock": 120 },
      { "_id": 2, "sku": "def", description: "product 2", "instock": 80 },
      { "_id": 3, "sku": "ijk", description: "product 3", "instock": 60 },
      { "_id": 4, "sku": "jkl", description: "product 4", "instock": 70 },
      { "_id": 5, "sku": null, description: "Incomplete" },
      { "_id": 6 }
    ]

    var result = mingo.aggregate(orders, [
      {
        $lookup: {
          from: inventory,
          localField: "item",
          foreignField: "sku",
          as: "inventory_docs"
        }
      }
    ])

    t.deepEqual(result, [
      {
        "_id": 1,
        "item": "abc",
        "price": 12,
        "quantity": 2,
        "inventory_docs": [
          { "_id": 1, "sku": "abc", description: "product 1", "instock": 120 }
        ]
      },
      {
        "_id": 2,
        "item": "jkl",
        "price": 20,
        "quantity": 1,
        "inventory_docs": [
          { "_id": 4, "sku": "jkl", "description": "product 4", "instock": 70 }
        ]
      },
      {
        "_id": 3,
        "inventory_docs": [
          { "_id": 5, "sku": null, "description": "Incomplete" },
          { "_id": 6 }
        ]
      }
    ], 'can apply $lookup operator')

    t.end()

  })

  t.test("$bucket operator", function (t) {

    var artwork = [
      {
        "_id": 1, "title": "The Pillars of Society", "artist": "Grosz", "year": 1926,
        "price": 199.99, "tags": ["painting", "satire", "Expressionism", "caricature"]
      },
      {
        "_id": 2, "title": "Melancholy III", "artist": "Munch", "year": 1902,
        "price": 280.00, "tags": ["woodcut", "Expressionism"]
      },
      {
        "_id": 3, "title": "Dancer", "artist": "Miro", "year": 1925,
        "price": 76.04, "tags": ["oil", "Surrealism", "painting"]
      },
      {
        "_id": 4, "title": "The Great Wave off Kanagawa", "artist": "Hokusai",
        "price": 167.30, "tags": ["woodblock", "ukiyo-e"]
      },
      {
        "_id": 5, "title": "The Persistence of Memory", "artist": "Dali", "year": 1931,
        "price": 483.00,
        "tags": ["Surrealism", "painting", "oil"]
      },
      {
        "_id": 6, "title": "Composition VII", "artist": "Kandinsky", "year": 1913,
        "price": 385.00,
        "tags": ["oil", "painting", "abstract"]
      },
      {
        "_id": 7, "title": "The Scream", "artist": "Munch", "year": 1893,
        "tags": ["Expressionism", "painting", "oil"]
      },
      {
        "_id": 8, "title": "Blue Flower", "artist": "O'Keefe", "year": 1918,
        "price": 118.42, "tags": ["abstract", "painting"]
      }
    ]

    var result = mingo.aggregate(artwork, [
      {
        $bucket: {
          groupBy: "$price",
          boundaries: [0, 200, 400],
          default: "Other",
          output: {
            "count": { $sum: 1 },
            "titles": { $push: "$title" }
          }
        }
      }
    ])

    t.deepEqual(result, [
      {
        "_id": 0,
        "count": 4,
        "titles": [
          "The Pillars of Society",
          "Dancer",
          "The Great Wave off Kanagawa",
          "Blue Flower"
        ]
      },
      {
        "_id": 200,
        "count": 2,
        "titles": [
          "Melancholy III",
          "Composition VII"
        ]
      },
      {
        "_id": "Other",
        "count": 2,
        "titles": [
          "The Persistence of Memory",
          "The Scream"
        ]
      }
    ], "can apply $bucket operator")

    t.end()
  })

  t.test('$bucketAuto operator', function (t) {

    var artwork = [
      {
        "_id": 1, "title": "The Pillars of Society", "artist": "Grosz", "year": 1926,
        "price": 199.99,
        "dimensions": { "height": 39, "width": 21, "units": "in" }
      },
      {
        "_id": 2, "title": "Melancholy III", "artist": "Munch", "year": 1902,
        "price": 280.00,
        "dimensions": { "height": 49, "width": 32, "units": "in" }
      },
      {
        "_id": 3, "title": "Dancer", "artist": "Miro", "year": 1925,
        "price": 76.04,
        "dimensions": { "height": 25, "width": 20, "units": "in" }
      },
      {
        "_id": 4, "title": "The Great Wave off Kanagawa", "artist": "Hokusai",
        "price": 167.30,
        "dimensions": { "height": 24, "width": 36, "units": "in" }
      },
      {
        "_id": 5, "title": "The Persistence of Memory", "artist": "Dali", "year": 1931,
        "price": 483.00,
        "dimensions": { "height": 20, "width": 24, "units": "in" }
      },
      {
        "_id": 6, "title": "Composition VII", "artist": "Kandinsky", "year": 1913,
        "price": 385.00,
        "dimensions": { "height": 30, "width": 46, "units": "in" }
      },
      {
        "_id": 7, "title": "The Scream", "artist": "Munch",
        "price": 159.00,
        "dimensions": { "height": 24, "width": 18, "units": "in" }
      },
      {
        "_id": 8, "title": "Blue Flower", "artist": "O'Keefe", "year": 1918,
        "price": 118.42,
        "dimensions": { "height": 24, "width": 20, "units": "in" }
      }
    ]

    var result = mingo.aggregate(artwork, [
      {
        $bucketAuto: {
          groupBy: "$price",
          buckets: 4
        }
      }
    ])

    t.deepEqual(result, [
      {
        "_id": {
          "min": 76.04,
          "max": 159.00
        },
        "count": 2
      },
      {
        "_id": {
          "min": 159.00,
          "max": 199.99
        },
        "count": 2
      },
      {
        "_id": {
          "min": 199.99,
          "max": 385.00
        },
        "count": 2
      },
      {
        "_id": {
          "min": 385.00,
          "max": 483.00
        },
        "count": 2
      }
    ], 'can apply $bucketAuto operator')

    var things = []
    for (var i = 0; i < 100; i++) {
      things.push({ _id: i })
    }

    result = mingo.aggregate(things, [
      {
        $bucketAuto: {
          groupBy: "$_id",
          buckets: 5
        }
      }
    ])

    t.deepEqual(result, [
      { "_id": { "min": 0, "max": 20 }, "count": 20 },
      { "_id": { "min": 20, "max": 40 }, "count": 20 },
      { "_id": { "min": 40, "max": 60 }, "count": 20 },
      { "_id": { "min": 60, "max": 80 }, "count": 20 },
      { "_id": { "min": 80, "max": 99 }, "count": 20 }
    ], "can apply $bucketAuto with nil granularity")

    t.end()
  })


  t.test("$facet operator", function (t) {

    var artwork = [
      {
        "_id": 1, "title": "The Pillars of Society", "artist": "Grosz", "year": 1926,
        "price": 199.99,
        "tags": ["painting", "satire", "Expressionism", "caricature"]
      },
      {
        "_id": 2, "title": "Melancholy III", "artist": "Munch", "year": 1902,
        "price": 280.00,
        "tags": ["woodcut", "Expressionism"]
      },
      {
        "_id": 3, "title": "Dancer", "artist": "Miro", "year": 1925,
        "price": 76.04,
        "tags": ["oil", "Surrealism", "painting"]
      },
      {
        "_id": 4, "title": "The Great Wave off Kanagawa", "artist": "Hokusai",
        "price": 167.30,
        "tags": ["woodblock", "ukiyo-e"]
      },
      {
        "_id": 5, "title": "The Persistence of Memory", "artist": "Dali", "year": 1931,
        "price": 483.00,
        "tags": ["Surrealism", "painting", "oil"]
      },
      {
        "_id": 6, "title": "Composition VII", "artist": "Kandinsky", "year": 1913,
        "price": 385.00,
        "tags": ["oil", "painting", "abstract"]
      },
      {
        "_id": 7, "title": "The Scream", "artist": "Munch", "year": 1893,
        "tags": ["Expressionism", "painting", "oil"]
      },
      {
        "_id": 8, "title": "Blue Flower", "artist": "O'Keefe", "year": 1918,
        "price": 118.42,
        "tags": ["abstract", "painting"]
      }
    ]

    var result = mingo.aggregate(artwork, [
      {
        $facet: {
          "categorizedByTags": [
            { $unwind: "$tags" },
            { $sortByCount: "$tags" }
          ],
          "categorizedByPrice": [
            // Filter out documents without a price e.g., _id: 7
            { $match: { price: { $exists: 1 } } },
            {
              $bucket: {
                groupBy: "$price",
                boundaries: [0, 150, 200, 300, 400],
                default: "Other",
                output: {
                  "count": { $sum: 1 },
                  "titles": { $push: "$title" }
                }
              }
            }
          ],
          "categorizedByYears(Auto)": [
            {
              $bucketAuto: {
                groupBy: "$year",
                buckets: 4
              }
            }
          ]
        }
      }
    ])

    t.deepEqual(result, {
      "categorizedByYears(Auto)": [
        // First bucket includes the document without a year, e.g., _id: 4
        { "_id": { "min": null, "max": 1902 }, "count": 2 },
        { "_id": { "min": 1902, "max": 1918 }, "count": 2 },
        { "_id": { "min": 1918, "max": 1926 }, "count": 2 },
        { "_id": { "min": 1926, "max": 1931 }, "count": 2 }
      ],
      "categorizedByPrice": [
        {
          "_id": 0,
          "count": 2,
          "titles": [
            "Dancer",
            "Blue Flower"
          ]
        },
        {
          "_id": 150,
          "count": 2,
          "titles": [
            "The Pillars of Society",
            "The Great Wave off Kanagawa"
          ]
        },
        {
          "_id": 200,
          "count": 1,
          "titles": [
            "Melancholy III"
          ]
        },
        {
          "_id": 300,
          "count": 1,
          "titles": [
            "Composition VII"
          ]
        },
        {
          // Includes document price outside of bucket boundaries, e.g., _id: 5
          "_id": "Other",
          "count": 1,
          "titles": [
            "The Persistence of Memory"
          ]
        }
      ],
      "categorizedByTags": [
        { "_id": "painting", "count": 6 },
        { "_id": "oil", "count": 4 },
        { "_id": "Expressionism", "count": 3 },
        { "_id": "Surrealism", "count": 2 },
        { "_id": "abstract", "count": 2 },
        { "_id": "satire", "count": 1 },
        { "_id": "caricature", "count": 1 },
        { "_id": "woodcut", "count": 1 },
        { "_id": "woodblock", "count": 1 },
        { "_id": "ukiyo-e", "count": 1 }
      ]
    }, "can apply $facet operator")

    t.end()
  })
});
