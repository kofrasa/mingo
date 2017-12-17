# mingo
JavaScript implementation of MongoDB query language

[![version](https://img.shields.io/npm/v/mingo.svg)](https://www.npmjs.org/package/mingo)
[![build status](https://img.shields.io/travis/kofrasa/mingo.svg)](http://travis-ci.org/kofrasa/mingo)
[![npm](https://img.shields.io/npm/dm/mingo.svg)](https://www.npmjs.org/package/mingo)
[![Codecov](https://img.shields.io/codecov/c/github/kofrasa/mingo.svg)](https://codecov.io/gh/kofrasa/mingo)

## Install
```$ npm install mingo```

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
- Fully ES6 module compatible
- Support integrating with custom collections via mixin
- Query filter and projection streaming. See [mingo-stream](https://github.com/kofrasa/mingo-stream)

For documentation on using query operators see [mongodb](http://docs.mongodb.org/manual/reference/operator/query/)

## Documentation
- [API](https://github.com/kofrasa/mingo/wiki/API)
- [Custom Operators](https://github.com/kofrasa/mingo/wiki/Custom-Operators)

## Usage
On the server side
```js
// Use as es6 module
import mingo from 'mingo'

// or vanilla nodeJS
var mingo = require('mingo')
```

For the browser
```html
// minified UMD module
<script type="text/javascript" src="./dist/mingo.min.js"></script>

// or gzipped UMD module
<script type="text/javascript" src="./dist/mingo.min.js.gz"></script>
```

Tiny configuration if needed
```js
// setup the key field for your collection
mingo.setup({
    key: '_id' // default
});
```

## Using query object to test objects
```js
// create a query with criteria
// find all grades for homework with score >= 50
let query = new mingo.Query({
    type: "homework",
    score: { $gte: 50 }
});

query.test(someObject)
```

## Searching and Filtering
```js
// `collection` is an Array of objects you want to query

// filter collection with find()
let cursor = query.find(collection);

// shorthand with query criteria
// cursor = mingo.find(collection, criteria);

// sort, skip and limit by chaining
cursor.sort({student_id: 1, score: -1})
    .skip(100)
    .limit(100);

// count matches. exhausts cursor
cursor.count();

// classic cursor iterator (ES5)
while (cursor.hasNext()) {
    console.log(cursor.next());
}

// ES6 iterators
for (let value of cursor) {
  console.log(value)
}

// all() to retrieve matched objects. exhausts cursor
cursor.all();
```

## Aggregation Pipeline
```js
let agg = new mingo.Aggregator([
    {'$match': { "type": "homework"}},
    {'$group':{'_id':'$student_id', 'score':{$min:'$score'}}},
    {'$sort':{'_id': 1, 'score': 1}}
]);

let result = agg.run(collection); // returns all results

// shorthand for above
result = mingo.aggregate(
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
let Grades = Backbone.Collection.extend(mingo.CollectionMixin);

// `collection` is an array of objects
let grades = new Grades(collection);

// find students with grades less than 50 in homework or quiz
// sort by score ascending and type descending
cursor = grades.query({
  $or: [{type: "quiz", score: {$lt: 50}}, {type: "homework", score: {$lt: 50}}]
}).sort({score: 1, type: -1}).limit(10);

// return grade with the lowest score
cursor.next();
```

The collection to mixin needs to provide a method with signature `toJSON() -> Array[Object]`.

## Why?
  - Alternative to writing lots of custom code for transforming collection of objects
  - Quick validation of MongoDB queries without the need for a database
  - MongoDB query language is among the best in the market and is well documented

## Contributing
* Submit pull requests to the [development](https://github.com/kofrasa/mingo/tree/development) branch
* Squash changes into one commit
* Run `make` to ensure build and tests pass

## License
MIT
