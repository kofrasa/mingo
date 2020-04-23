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

- [Package docs](http://kofrasa.net/mingo/)
- [Custom Operators](https://github.com/kofrasa/mingo/wiki/Custom-Operators)

## Usage

```js
// Use as es6 module
import mingo from 'mingo'

// or vanilla nodeJS
const mingo = require('mingo')
```

### Changes in 3.0.0

#### Default exports and operators

The default export of the main module only includes `Aggregator`, `Query`, `aggregate()`, `find()`, and `remove()`.

Only [Query and Projection](https://docs.mongodb.com/manual/reference/operator/query/) operators are loaded by default when using the main module.
This is done using the side-effect module `mingo/init`, and automatically includes pipeline operators `$project`, `$skip`, `$limit`, and `$sort`.

If your application uses a most of the available operators or you do not care about bundle size, you can load all operators as shown below.

```js
// Note that doing this effectively imports the entire library into your bundle and unused operators cannot be tree shaked
import 'mingo/init/system'
```

By using a side-effect module you can also load operators at startup in a `NodeJS` environment such as;

```sh
# loads only the default operators
node -r 'mingo/init' myscript.js

# load all defined operators
node -r 'mingo/init/system' myscript.js
```

#### Custom Operators

The `addOperators` function for registering custom operators and helper constants have been moved to `mingo/core`.
The constants `OP_XXX` have been deprecated and replace with an enum type `OperatorType` also in `mingo/core`.
The values defined include;

- `ACCUMULATOR`
- `EXPRESSION`
- `PIPELINE`
- `PROJECTION`
- `QUERY`

Lastly, the function argument to `addOperators(operatorType, fn)` now accepts an object with the these two internal functions;

- `computeValue(obj: object | any[], expr: any, operator: string, options?: ComputeOptions): any`
- `resolve(obj: object | any[], selector: string, options?: ResolveOptions): any`

Any extra utility may be imported directly from the specific module.

### Importing submodules

Submodule imports are supported for both ES6 and ES5. For ES5 projects using commonJS style `require()` syntax, the [esm](https://www.npmjs.com/package/esm) is used to load the main entry point for compatibility.

The following two examples are equivalent.

#### ES6

```js
import { $unwind } from 'mingo/operators/pipeline'
```

#### ES5

Unlike the ES6 version, it is necessary to specify the operator module in the path to avoid loading any extras

```js
const $unwind = require('mingo/operators/pipeline/unwind').$unwind
```

## Configuration

To support tree-shaking, you may import and register specific operators that will be used in your application.

```js
import { useOperators, OperatorType } from 'mingo/core'
import { $trunc } from 'mingo/operators/expression'
import { $bucket } from 'mingo/operators/pipeline'

useOperators(OperatorType.EXPRESSION, { $trunc, $floor })
useOperators(OperatorType.PIPELINE, { $bucket })
```

## Using query object to test objects

```js
import mingo from 'mingo'

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
import mingo from 'mingo'

// input is either an Array or any iterable source (i.e Object{next:Function}) including ES6 generators.
let criteria = { score: { $gt: 10 } }

let query = new mingo.Query(criteria)

// filter collection with find()
let cursor = query.find(collection)

// alternatively use shorthand
// cursor = mingo.find(collection, criteria)

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
import { Aggregator } from 'mingo/aggregator'
import { useOperators, OperatorType } from 'mingo/core'
import { $match, $group } from 'mingo/operators/pipeline'
import { $min } from 'mingo/operators/accumulator'

// ensure the required operators are preloaded prior to using them.
useOperators(OperatorType.PIPELINE, { $match, $group })
useOperators(OperatorType.ACCUMULATOR, { $min })

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
- Run `make test` to build and execute unit tests
- Submit pull request

## License

MIT
