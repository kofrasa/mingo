# mingo

MongoDB query language for in-memory objects

![license](https://img.shields.io/github/license/kofrasa/mingo)
[![version](https://img.shields.io/npm/v/mingo)](https://www.npmjs.org/package/mingo)
[![build](https://github.com/kofrasa/mingo/actions/workflows/node.js.yml/badge.svg)](https://github.com/kofrasa/mingo/actions/workflows/node.js.yml)
![issues](https://img.shields.io/github/issues/kofrasa/mingo)
[![codecov](https://img.shields.io/codecov/c/github/kofrasa/mingo)](https://codecov.io/gh/kofrasa/mingo)
[![npm downloads](https://img.shields.io/npm/dm/mingo)](https://www.npmjs.org/package/mingo)

## Install

`$ npm install mingo`

## Features

- Supports dot notation for both _`<array>.<index>`_ and _`<document>.<field>`_ selectors
- Query and Projection Operators
  - [Array Operators](https://docs.mongodb.com/manual/reference/operator/query-array/)
  - [Bitwise Operators](https://docs.mongodb.com/manual/reference/operator/query-bitwise/)
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
    - [Custom Aggregation Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#custom-aggregation-expression-operators)
    - [Date Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators/)
    - [Literal Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#literal-expression-operators/)
    - [Miscellaneous Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#miscellaneous-operators)
    - [Object Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#object-expression-operators)
    - [Set Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators/)
    - [String Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators)
    - [Trignometry Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators)
    - [Type Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators)
    - [Variable Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/#variable-expression-operators)
  - [Window Operators](https://docs.mongodb.com/manual/reference/operator/aggregation/setWindowFields/#window-operators)
- Supports aggregaion variables; [`$$ROOT`, `$$CURRENT`, `$$DESCEND`, `$$PRUNE`, `$$KEEP`, `$$REMOVE`, `$$NOW`](https://docs.mongodb.com/manual/reference/aggregation-variables/)
- Filtering and aggregation using streaming.

For documentation on using query operators see [mongodb](http://docs.mongodb.org/manual/reference/operator/query/)

Browse [package docs](http://kofrasa.net/mingo/) for modules.

## Usage

```js
// Use as es6 module
import mingo from "mingo";

// or vanilla nodeJS
const mingo = require("mingo");
```

The main module exports `Aggregator`, `Query`, `aggregate()`, `find()`, and `remove()`. Only [Query and Projection](https://docs.mongodb.com/manual/reference/operator/query/) operators are loaded by default when you require the main module. This is done using the side-effect module `mingo/init/basic` and automatically includes pipeline operators; `$project`, `$skip`, `$limit`, and `$sort`.

## Loading Operators

MongoDB query library is huge and you may not need all the operators. If using this library on the server-side where bundle size is not a concern, you can load all operators as shown below.

```js
// Note that doing this effectively imports the entire library into your bundle and unused operators cannot be tree shaked
import "mingo/init/system";
```

Or from the node CLI

```sh
node -r 'mingo/init/system' myscript.js
```

To support tree-shaking for client side bundles, you can import and register specific operators that will be used in your application.

### ES6

```js
import { useOperators, OperatorType } from "mingo/core";
import { $trunc } from "mingo/operators/expression";
import { $bucket } from "mingo/operators/pipeline";

useOperators(OperatorType.EXPRESSION, { $trunc });
useOperators(OperatorType.PIPELINE, { $bucket });
```

### ES5

```js
const core = require("mingo/core");
const $trunc = require("mingo/operators/expression").$trunc;
const $bucket = require("mingo/operators/pipeline").$bucket;
const useOperators = core.useOperators;
const OperatorType = core.OperatorType;

useOperators(OperatorType.EXPRESSION, { $trunc: $trunc });
useOperators(OperatorType.PIPELINE, { $bucket: $bucket });
```

## Using query to test objects

```js
import { Query } from "mingo";

// create a query with criteria
// find all grades for homework with score >= 50
let query = new Query({
  type: "homework",
  score: { $gte: 50 },
});

// test if an object matches query
query.test(doc);
```

## Searching and Filtering

```js
import { Query } from "mingo";

// input is either an Array or any iterable source (i.e Object{next:Function}) including ES6 generators.
let criteria = { score: { $gt: 10 } };

let query = new Query(criteria);

// filter collection with find()
let cursor = query.find(collection);

// alternatively use shorthand
// cursor = mingo.find(collection, criteria)

// sort, skip and limit by chaining
cursor.sort({ student_id: 1, score: -1 }).skip(100).limit(100);

// count matches. exhausts cursor
cursor.count();

// classic cursor iterator (old school)
while (cursor.hasNext()) {
  console.log(cursor.next());
}

// ES6 iterators (new cool)
for (let value of cursor) {
  console.log(value);
}

// all() to retrieve matched objects. exhausts cursor
cursor.all();
```

## Using $jsonSchema operator

To use the `$jsonSchema` operator, you must register your own `JsonSchemaValidator` in the options.
No default implementation is provided out of the box so users can use a library with their preferred schema format.

The example below uses [Ajv](https://www.npmjs.com/package/ajv) to implement schema validation.

```js
import { RawObject } from "mingo/types"
import { JsonSchemaValidator } from "mingo/core"
import Ajv, { Schema } from "ajv"

const jsonSchemaValidator: JsonSchemaValidator = (s: RawObject) => {
  const ajv = new Ajv();
  const v = ajv.compile(s as Schema);
  return (o: RawObject) => (v(o) ? true : false);
};

const schema = {
  type: "object",
  required: ["item", "qty", "instock"],
  properties: {
    item: { type: "string" },
    qty: { type: "integer" },
    size: {
      type: "object",
      required: ["uom"],
      properties: {
        uom: { type: "string" },
        h: { type: "number" },
        w: { type: "number" },
      },
    },
    instock: { type: "boolean" },
  },
};

// queries documents using schema validation
find(docs, { $jsonSchema: schema }, {}, { jsonSchemaValidator }).all();
```

**Note:** An error is thrown when the `$jsonSchema` operator is used without a the `jsonSchemaValidator` configured.

## Aggregation Pipeline

```js
import { Aggregator } from "mingo/aggregator";
import { useOperators, OperatorType } from "mingo/core";
import { $match, $group } from "mingo/operators/pipeline";
import { $min } from "mingo/operators/accumulator";

// ensure the required operators are preloaded prior to using them.
useOperators(OperatorType.PIPELINE, { $match, $group });
useOperators(OperatorType.ACCUMULATOR, { $min });

let agg = new Aggregator([
  { $match: { type: "homework" } },
  { $group: { _id: "$student_id", score: { $min: "$score" } } },
  { $sort: { _id: 1, score: 1 } },
]);

// return an iterator for streaming results
let stream = agg.stream(collection);

// return all results. same as `stream.all()`
let result = agg.run(collection);
```

## Options

Query and aggregation operations can be configured with options to enabled different features or customize how documents are processed. Some options are only relevant to specific operators and need not be specified if not required.

```js
interface Options {
  /** The key that is used to lookup the ID value of a document. @default "_id" */
  readonly idKey?: string;
  /** The collation specification for string sorting operations. */
  readonly collation?: CollationSpec;
  /** Determines how to treat inputs and outputs. @default ProcessingMode.CLONE_OFF */
  readonly processingMode?: ProcessingMode;
  /**
   * Enforces strict MongoDB compatibilty. See readme for differences. @default true.
   * When disabled, the $elemMatch projection operator returns all matching nested documents instead of only the first.
   */
  readonly useStrictMode?: boolean;
  /**
   * Enables or disables custom script execution.
   * When disabled, you cannot use operations that execute custom code, such as the $where, $accumulator, and $function.
   * @default true
   */
  readonly scriptEnabled?: boolean;
  /** Hash function to replace the somewhat weaker default implementation. */
  readonly hashFunction?: HashFunction;
  /** Function to resolve strings to arrays for use with operators that reference other collections such as; `$lookup`, `$out` and `$merge`. */
  readonly collectionResolver?: CollectionResolver;
  /** JSON schema validator to use with the '$jsonSchema' operator. This is required in order to use the operator. */
  readonly jsonSchemaValidator?: JsonSchemaValidator;
  /** Global variables. */
  readonly variables?: Readonly<RawObject>;
}
```

## Adding Custom Operators
Custom operators can be added with the [useOperators(type, operatorMap)](http://kofrasa.net/mingo/modules/core.html#useOperators) where
`type` is the kind of operators to add, and `operatorMap` is mapping of function names beginning with `$` to their implementations for the specific operator type.

Once an operator has been registered the function referenced cannot be replaced. This ensures that behaviour of `mingo` remain consistent at runtime.

Each operator type function has a different signature and must be registered correctly otherwise the result will be unexpected.

- [AccumulatorOperator](http://kofrasa.net/mingo/modules/core.html#AccumulatorOperator)
- [ExpressionOperator](http://kofrasa.net/mingo/modules/core.html#ExpressionOperator)
- [ProjectionOperator](http://kofrasa.net/mingo/modules/core.html#ProjectionOperator)
- [PipelineOperator](http://kofrasa.net/mingo/modules/core.html#PipelineOperator)
- [WindowOperator](http://kofrasa.net/mingo/modules/core.html#WindowOperator)
- [QueryOperator](http://kofrasa.net/mingo/modules/core.html#QueryOperator)

Pre-loaded operators defined [here](https://github.com/kofrasa/mingo/blob/master/src/init/basic.ts) cannot be overridden. These include;
- All [query](http://kofrasa.net/mingo/modules/operators_query.html) operators.
- All [projection](http://kofrasa.net/mingo/modules/operators_projection.html) operators.
- Expression operators for [boolean](http://kofrasa.net/mingo/modules/operators_expression_boolean.html) and [comparison](http://kofrasa.net/mingo/modules/operators_expression_comparison.html).
- Pipeline [operators](http://kofrasa.net/mingo/modules/operators_pipeline.html); `$project`, `$skip`, `$limit`, and `$sort`.

## Differences from MongoDB

1. There is no concept of a collection. Input data is either an array of objects or a generator function to support streaming.
1. Does not support server specific operators. E.g. `$collStat`, `$planCacheStats`, `$listSessions`.
1. Does not support GeoJSON query operators.
1. Does not support query operators; `$comment`, `$meta`, `$text`.
1. Does not support aggregation expression operators; `$toObjectId`, `$binarySize`, `bsonSize`.
1. Agregation pipeline operator `$merge` enforces unique constraint on the lookup field at runtime.
1. Custom function evaluation operators; `$where`, `$function`, and `$accumulator`, do not accept strings as the function body.
1. Custom function evaluation operators are enabled by default. They can be disabled with the `scriptEnabled` option.
1. Custom function evaluation operator [$accumulator](https://docs.mongodb.com/manual/reference/operator/aggregation/accumulator/) does not support the `merge` option.
1. The `$jsonSchema` operator requires the user to register their own validator using the `jsonSchemaValidator` option.

## Benefits

- Better alternative to writing custom code for transforming collection of objects
- Quick validation of MongoDB queries without the need for a database
- MongoDB query language is among the best in the market and is well documented

## Contributing

- Squash changes into one commit
- Run `npm test` to build and execute unit tests
- Submit pull request

To validate correct behaviour and semantics of operators, you may also test against [mongoplayground.net](https://mongoplayground.net/).

## License

MIT
