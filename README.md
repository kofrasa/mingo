# Mingo
JavaScript implementation of MongoDB query language

Mingo harnesses the power of MongoDB-style queries and allows direct querying of in-memory 
javascript objects in both client and server-side environments.

[![build status](https://secure.travis-ci.org/kofrasa/mingo.png)](http://travis-ci.org/kofrasa/mingo)

## Dependencies
[underscore](https://github.com/jashkenas/underscore)

## Installing
```$ npm install mingo```

In browser
```html
<!-- DO NOT FORGET Underscore -->
<script type="text/javascript" src="./underscore-min.js"></script>
<script type="text/javascript" src="./mingo.min.js"></script>
```

## Features
- Supports Dot Notation for both '_&lt;array&gt;.&lt;index&gt;_' and '_&lt;document&gt;.&lt;field&gt;_' selectors
- Query and Projection Operators
    - Array Operators (`$all`, `$elemMatch`, `$size`)
    - Comparisons Operators (`$gt`, `$gte`, `$lt`, `$lte`, `$ne`, `$nin`, `$in`)
    - Element Operators (`$exists`, `$type`)
    - Evaluation Operators (`$regex`, `$mod`, `$where`)
    - Logical Operators (`$and`, `$or`, `$nor`, `$not`)
- Aggregation Framework Operators
    - Pipeline Operators (`$group`, `$match`, `$project`, `$sort`, `$limit`, `$unwind`, `$skip`)
    - Group Operators (`$addToSet`, `$sum`, `$max`, `$min`, `$avg`, `$push`, `$first`, `$last`)
    - Projection Operators (`$elemMatch`, `$slice`)
    - Arithmetic Operators (`$add`, `$divide`, `$mod`, `$multiply`, `$subtract`)
    - Array Operators (`$size`)
    - Boolean Operators (`$and`, `$or`, `$not`)
    - Comparisons Operators (`$cmp`, `$gt`, `$gte`, `$lt`, `$lte`, `$ne`, `$nin`, `$in`)
    - Conditional Operators (`$cond`, `$ifNull`)
    - Date Operators (`$dayOfYear`, `$dayOfMonth`, `$dayOfWeek`, `$year`, `$month`, `$week`, `$hour`, `$minute`, `$second`, `$millisecond`, `$dateToString`)
    - Literal Operators (`$literal`)
    - Set Operators (`$setEquals`, `$setIntersection`, `$setDifference`, `$setUnion`, `$setIsSubset`, `$anyElementTrue`, `$allElementsTrue`)
    - String Operators (`$strcasecmp`, `$concat`, `$substr`, `$toLower`, `$toUpper`)
    - Variable Operators (`$map`, `$let`)
- Support for custom operators
- BackboneJS Integration
- JSON stream filtering and projection. *NodeJS only*

For documentation on using query operators see [mongodb](http://docs.mongodb.org/manual/reference/operator/query/)


## Usage
```js

var Mingo = require('mingo');
// or just access *Mingo* global in browser

// setup the key field for your collection
Mingo.setup({
    key: '_id' // default
});

// create a query with criteria
// find all grades for homework with score >= 50
var query = new Mingo.Query({
    type: "homework",
    score: { $gte: 50 }
});
```

## Searching and Filtering
```js
// filter collection with find()
var cursor = query.find(collection);

// shorthand with query criteria
// cursor = Mingo.find(collection, criteria);

// sort, skip and limit by chaining
cursor.sort({student_id: 1, score: -1})
    .skip(100)
    .limit(100);

// count matches
cursor.count();

// iterate cursor
// iteration is forward only
while (cursor.hasNext()) {
    console.log(cursor.next());
}

// use first(), last() and all() to retrieve matched objects
cursor.first();
cursor.last();
cursor.all();

// Filter non-matched objects (
var result = query.remove(collection);
```

## Aggregation Pipeline
```js
var agg = new Mingo.Aggregator([
    {'$match': { "type": "homework"}},
    {'$group':{'_id':'$student_id', 'score':{$min:'$score'}}},
    {'$sort':{'_id': 1, 'score': 1}}
]);

var result = agg.run(collection);

// shorthand
result = Mingo.aggregate(
    collection,
    [
        {'$match': { "type": "homework"}},
        {'$group':{'_id':'$student_id', 'score':{$min:'$score'}}},
        {'$sort':{'_id': 1, 'score': 1}}
    ]
);
```

## Stream Filtering
```js
var JSONStream = require('JSONStream'),
    fs = require('fs'),
    Mingo = require('mingo');

var query = new Mingo.Query({
  scores: { $elemMatch: {type: "exam", score: {$gt: 90}} }
}, {name: 1});

file = fs.createReadStream('./students.json');

var qs = query.stream();
qs.on('data', function (data) {
    console.log(data); // log filtered outputs
    // ex. { name: 'Dinah Sauve', _id: 49 }
});

file.pipe(JSONStream.parse("*")).pipe(qs);
```

## Backbone Integration
```js
// using with Backbone
var Grades = Backbone.Collection.extend(Mingo.CollectionMixin);

var grades = new Grades(collection);

// find students with grades less than 50 in homework or quiz
// sort by score ascending and type descending
cursor = grades.query({
    $or: [{type: "quiz", score: {$lt: 50}}, {type: "homework", score: {$lt: 50}}]
}).sort({score: 1, type: -1}).limit(10);

// print grade with the lowest score
cursor.first();
```

## Documentation
- [API](https://github.com/kofrasa/mingo/wiki/API)
- [Custom Operators](https://github.com/kofrasa/mingo/wiki/Custom-Operators)

## TODO
 - Geospatial Query Operators (`$geoWithin`, `$geoIntersects`, `$near`, `$nearSphere`)
 - Geometry Specifiers (`$geometry`, `$maxDistance`, `$center`, `$centerSphere`, `$box`, `$polygon`)

## License
MIT