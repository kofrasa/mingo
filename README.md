# Mingo
JavaScript implementation of MongoDB query language

Mingo harnesses the power of MongoDB-style queries and allows direct querying of in-memory
javascript objects in both client and server-side environments. This library is self-contained and has zero-dependencies

[![version](https://img.shields.io/npm/v/mingo.svg)](https://www.npmjs.org/package/mingo)
[![build status](https://secure.travis-ci.org/kofrasa/mingo.png)](http://travis-ci.org/kofrasa/mingo)

## Installing
```$ npm install mingo```

In browser
```html
<script type="text/javascript" src="./dist/mingo.min.js"></script>
```

## Features
- Supports Dot Notation for both '_&lt;array&gt;.&lt;index&gt;_' and '_&lt;document&gt;.&lt;field&gt;_' selectors
- Query and Projection Operators
    - [Array Operators](https://docs.mongodb.com/manual/reference/operator/query-array/)
    - [Comparisons Operators](https://docs.mongodb.com/manual/reference/operator/query-comparison/)
    - [Element Operators](https://docs.mongodb.com/manual/reference/operator/query-element/)
    - [Evaluation Operators](https://docs.mongodb.com/manual/reference/operator/query-evaluation/)
    - [Logical Operators](https://docs.mongodb.com/manual/reference/operator/query-logical/)
- Aggregation Framework Operators
    - [Pipeline Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/)
    - [Group Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-group/)
    - [Projection Operators](https://docs.mongodb.com/manual/reference/operator/projection/)
    - [Arithmetic Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-arithmetic/)
    - [Array Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-array/)
    - [Boolean Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-boolean/)
    - [Comparisons Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-comparison/)
    - [Conditional Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-conditional/)
    - [Date Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-date/)
    - [Literal Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-literal/)
    - [Set Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-set/)
    - [String Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-string/)
    - [Variable Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-projection/)
- Support for adding custom operators
- Match against user-defined types
- Support for aggregaion variables
    - [`$$ROOT`,`$$CURRENT`,`$$DESCEND`,`$$PRUNE`,`$$KEEP`](https://docs.mongodb.com/manual/reference/aggregation-variables/)
- Support integrating with custom collections via mixin
- Query filter and projection streaming. See [mingo-stream](https://github.com/kofrasa/mingo-stream)

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
// `collection` is an Array of objects you want to query

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

## Integration with custom collection
```js
// using Backbone.Collection as an example (any user-defined object will do)
var Grades = Backbone.Collection.extend(Mingo.CollectionMixin);

// `collection` is an array of objects
var grades = new Grades(collection);

// find students with grades less than 50 in homework or quiz
// sort by score ascending and type descending
cursor = grades.query({
    $or: [{type: "quiz", score: {$lt: 50}}, {type: "homework", score: {$lt: 50}}]
}).sort({score: 1, type: -1}).limit(10);

// return grade with the lowest score
cursor.first();
```

The collection to mixin needs to provide a method with signature `toJSON() -> Array[Object]`.

## Documentation
- [API](https://github.com/kofrasa/mingo/wiki/API)
- [Custom Operators](https://github.com/kofrasa/mingo/wiki/Custom-Operators)

## Contributing
- Submit pull requests to the [development](https://github.com/kofrasa/mingo/tree/development) branch

## License
MIT
