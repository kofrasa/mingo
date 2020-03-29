# mingo

JavaScript implementation of MongoDB query language

[![version](https://img.shields.io/npm/v/mingo.svg)](https://www.npmjs.org/package/mingo)
[![build status](https://img.shields.io/travis/kofrasa/mingo.svg)](http://travis-ci.org/kofrasa/mingo)
[![npm](https://img.shields.io/npm/dm/mingo.svg)](https://www.npmjs.org/package/mingo)
[![Codecov](https://img.shields.io/codecov/c/github/kofrasa/mingo.svg)](https://codecov.io/gh/kofrasa/mingo)
[![Code Quality: Javascript](https://img.shields.io/lgtm/grade/javascript/g/kofrasa/mingo.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/kofrasa/mingo/context:javascript)
[![Total Alerts](https://img.shields.io/lgtm/alerts/g/kofrasa/mingo.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/kofrasa/mingo/alerts)

## Install

```$ npm install mingo```

## Features

- Supports Dot Notation for both _`<array>.<index>`_ and _`<document>.<field>`_ selectors
- Query and Projection Operators
  - [Array Operators](https://docs.mongodb.com/manual/reference/operator/query-array/)
  - [Comparisons Operators](https://docs.mongodb.com/manual/reference/operator/query-comparison/)
  - [Element Operators](https://docs.mongodb.com/manual/reference/operator/query-element/)
  - [Evaluation Operators](https://docs.mongodb.com/manual/reference/operator/query-evaluation/)
  - [Logical Operators](https://docs.mongodb.com/manual/reference/operator/query-logical/)
  - [Projection Operators](https://docs.mongodb.com/manual/reference/operator/projection/)
- Aggregation Framework Operators
  - [Pipeline Operators](https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/)
  - [Accumulator Operators](https://docs.mongodb.com/manual/reference/operator/aggregation#accumulators-group/)
  - [Expression Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#expression-operators)
    - [Arithmetic Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators)
    - [Array Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators/)
    - [Boolean Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#boolean-expression-operators/)
    - [Comparisons Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators/)
    - [Conditional Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#conditional-expression-operators/)
    - [Date Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators/)
    - [Literal Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#literal-expression-operators/)
    - [Object Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#object-expression-operators)
    - [Set Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators/)
    - [Type Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators)
    - [String Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators)
    - [Variable Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#variable-expression-operators)
- Support for adding custom operators using `mingo.addOperators`
- Match against user-defined types
- Support for aggregaion variables
  - [`$$ROOT`,`$$CURRENT`,`$$DESCEND`,`$$PRUNE`,`$$KEEP`,`$$REMOVE`](https://docs.mongodb.com/manual/reference/aggregation-variables/)
- ES6 module compatible
- Support integrating with custom collections via mixin
- Query filtering and aggregation streaming.

For documentation on using query operators see [mongodb](http://docs.mongodb.org/manual/reference/operator/query/)

## Documentation

- [API](https://github.com/kofrasa/mingo/wiki/API)
- [Custom Operators](https://github.com/kofrasa/mingo/wiki/Custom-Operators)
- [System Operators](https://github.com/kofrasa/mingo/wiki/System-Operators)

## Usage

```js
// Use as es6 module
import * as mingo from 'mingo'

// or vanilla nodeJS
var mingo = require('mingo')

```

## Configuration

```js

import { setup, enableSystemOperators } from 'mingo'

// setup the key field for your collection
setup({
  key: '_id' // default
});

// enable all available system operators
enableSystemOperators()

// this includes all operators and will increase the final bundle size significantly for users' project.
// to avoid bloating your bundle size, select and register operators to use explicitly.

// The query and projection operators are loaded by default on first time import
```

## Using query object to test objects

```js
// create a query with criteria
// find all grades for homework with score >= 50
let query = new mingo.Query({
  type: "homework",
  score: { $gte: 50 }
});

// test if an object matches query
query.test(doc)
```

## Searching and Filtering

```js
// input is either an Array or any iterable source (i.e Object{next:Function}) including ES6 generators.

// filter collection with find()
let cursor = query.find(collection)

// shorthand with query criteria
cursor = mingo.find(collection, criteria)

// sort, skip and limit by chaining
cursor.sort({student_id: 1, score: -1})
  .skip(100)
  .limit(100)

// count matches. exhausts cursor
cursor.count()

// classic cursor iterator (old school)
while (cursor.hasNext()) {
  console.log(cursor.next())
}

// ES6 iterators (new cool)
for (let value of cursor) {
  console.log(value)
}

// all() to retrieve matched objects. exhausts cursor
cursor.all()
```

## Aggregation Pipeline

```js
import { Aggregator, useOperators, OP_PIPELINE, OP_ACCUMULATOR } from 'mingo'
import { $match, $group, $sort } from 'mingo/operators/pipeline'
import { $min } from 'mingo/operators/accumulator'

// ensure the required operators are loaded.
// this only needs to be done once so can be placed in a top-level initialization module
useOperators(OP_PIPELINE, { $match, $group, $sort })
useOperators(OP_ACCUMULATOR, { $min })

let agg = new Aggregator([
  {'$match': { "type": "homework"}},
  {'$group': {'_id':'$student_id', 'score':{$min:'$score'}}},
  {'$sort': {'_id': 1, 'score': 1}}
])

// return an iterator for streaming results
let stream = agg.stream(collection)

// return all results. same as `stream.all()`
let result = agg.run(collection)
```

## Benefits

- Better alternative to writing custom code for transforming collection of objects
- Quick validation of MongoDB queries without the need for a database
- MongoDB query language is among the best in the market and is well documented

## Contributing

- Squash changes into one commit
- Run `make` to build and execute unit tests
- Submit pull request

## License

MIT
